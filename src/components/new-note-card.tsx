import { zodResolver } from '@hookform/resolvers/zod'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { ChangeEvent, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export interface NewNoteCardProps {
  onNoteCreate: (content: string) => void
}

const newNoteCardSchema = z.object({
  note: z.string().min(2),
})

type NewNoteCardSchema = z.infer<typeof newNoteCardSchema>

let speechRecognition: SpeechRecognition | null = null

export function NewNoteCard({ onNoteCreate }: NewNoteCardProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { register, handleSubmit, reset, setValue } =
    useForm<NewNoteCardSchema>({
      resolver: zodResolver(newNoteCardSchema),
    })

  const [shouldShowOnBoarding, setShouldShowOnBoarding] = useState(true)

  function handleStartEditor() {
    setShouldShowOnBoarding(false)
  }

  function handleContentChanged(event: ChangeEvent<HTMLTextAreaElement>) {
    if (event.target.value === '') {
      setShouldShowOnBoarding(true)
    }
  }

  function handleSaveNote(data: NewNoteCardSchema) {
    if (data.note === '') {
      return
    }

    onNoteCreate(data.note)

    reset()
    setShouldShowOnBoarding(true)

    setIsDialogOpen(false)

    toast.success('Nota criada com sucesso!')
  }

  function handleStartRecording() {
    const isSpeechRecognitionAPIAvailable =
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window

    if (!isSpeechRecognitionAPIAvailable) {
      return alert('Infelizmente seu navegador não suporta a API de gravação!')
    }

    setIsRecording(true)
    setShouldShowOnBoarding(false)

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition

    speechRecognition = new SpeechRecognitionAPI()

    speechRecognition.lang = 'pt-BR'
    speechRecognition.continuous = true // Não vai parar de gravar até o usuário parar; No false ele para de gravar se parar de falar.
    speechRecognition.maxAlternatives = 1 // Impede que traga varias alternativas e trás somente a que a api acha que é.
    speechRecognition.interimResults = true // Trás os resultados enquanto fala, não espera terminar de falar

    speechRecognition.onresult = (event) => {
      // O event.results trás todas as palavras em uma lista e precisamos junta-las;
      const transcription = Array.from(event.results).reduce((text, result) => {
        return text.concat(result[0].transcript)
      }, '')

      setValue('note', transcription)
    }

    speechRecognition.onerror = (event) => {
      console.log(event.error)
    }

    speechRecognition.start()
  }

  function handleStopRecording() {
    setIsRecording(false)

    if (speechRecognition !== null) {
      speechRecognition?.stop()
    }
  }

  return (
    <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <Dialog.Trigger className="flex flex-col gap-3 rounded-md bg-slate-700 p-5 text-left outline-none hover:ring-2 hover:ring-slate-600 focus-visible:ring-1 focus-visible:ring-lime-400 ">
        <span className="text-sm font-medium text-slate-200">
          Adicionar nota
        </span>
        <p className="text-sm leading-6 text-slate-400">
          Grave uma nota em áudio que será convertida para texto
          automaticamente.
        </p>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.DialogOverlay className="fixed inset-0 bg-black/80" />

        <Dialog.Content className="fixed inset-0 flex w-full flex-col overflow-hidden bg-slate-700 outline-none md:inset-auto md:left-1/2 md:top-1/2 md:h-[60vh] md:max-w-[640px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-md">
          <Dialog.Close className="group absolute right-0 top-0 rounded-sm p-1.5 text-slate-500 hover:bg-slate-800">
            <X className="size-5 group-hover:text-red-400" />
          </Dialog.Close>

          <form className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-3 p-5">
              <span className="text-sm font-medium text-slate-200">
                Adicionar nota
              </span>

              {shouldShowOnBoarding ? (
                <p className="text-sm leading-6 text-slate-400 ">
                  Comece{' '}
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="font-medium text-lime-400 hover:underline hover:underline-offset-2"
                  >
                    gravando uma nota em áudio
                  </button>{' '}
                  ou se preferir{' '}
                  <button
                    type="button"
                    onClick={handleStartEditor}
                    className="font-medium text-lime-400 hover:underline hover:underline-offset-2"
                  >
                    utilize apenas texto
                  </button>
                  .
                </p>
              ) : (
                <textarea
                  {...register('note')}
                  autoFocus
                  className="flex-1 resize-none bg-transparent text-sm text-slate-400 outline-none"
                  onChange={handleContentChanged}
                  // placeholder="Crie sua nota..."
                />
              )}
            </div>

            {isRecording ? (
              <button
                type="button"
                onClick={handleStopRecording}
                className="flex w-full items-center justify-center gap-2 bg-slate-900 py-4 text-center text-sm font-semibold text-slate-300 outline-none hover:text-slate-100"
              >
                <div className="size-3 animate-pulse rounded-full bg-red-500" />
                Gravando! (clique p/ interromper)
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(handleSaveNote)}
                className="w-full bg-lime-400 py-4 text-center text-sm font-semibold text-lime-950 outline-none hover:bg-lime-500"
              >
                Salvar nota
              </button>
            )}
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
