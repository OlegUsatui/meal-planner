import { X } from 'lucide-react'
import { useEffect, useState, type ClipboardEvent } from 'react'
import { RecipeImageEditor } from './RecipeImageEditor'
import { RecipePhotoCard } from './RecipePhotoCard'
import { imageFileFromClipboard } from '../image/process-recipe-image'
import type { RecipeImageInput } from '../types'
import { Dialog } from '../../../shared/ui/Dialog'
import { Button, IconButton } from '../../../shared/ui/Button'

type Props = { image: RecipeImageInput | null; initialFile?: File; onApply: (image: RecipeImageInput & { blob: Blob }) => void; onRemove: () => void; onClose: () => void }

export function RecipeImageDialog({ image, initialFile, onApply, onRemove, onClose }: Props) {
  const [file, setFile] = useState<File | undefined>(initialFile)
  const imageUrl = useImageUrl(image)
  useEffect(() => setFile(initialFile), [initialFile])
  const pasteImage = (event: ClipboardEvent<HTMLDivElement>) => {
    const pastedFile = imageFileFromClipboard(event.clipboardData)
    if (!pastedFile) return
    event.preventDefault()
    event.stopPropagation()
    setFile(pastedFile)
  }
  return <div onPaste={pasteImage}><Dialog eyebrow="Фото рецепту" title={file ? 'Налаштуйте фінальний кадр' : 'Завантаження та редагування'} titleId="recipe-image-dialog-title" className="recipe-image-dialog" backdropClassName="recipe-image-dialog-backdrop" onClose={onClose} actions={file ? undefined : <Button variant="secondary" onClick={onClose}>Закрити</Button>}>
    {file ? <RecipeImageEditor file={file} onApply={onApply} onCancel={() => initialFile ? onClose() : setFile(undefined)} /> : <><IconButton className="recipe-image-dialog-close" aria-label="Закрити редактор фото" onClick={onClose}><X aria-hidden="true" /></IconButton><RecipePhotoCard imageUrl={imageUrl} onSelect={setFile} onRemove={image ? onRemove : undefined} /></>}
  </Dialog></div>
}

function useImageUrl(image: RecipeImageInput | null): string {
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (!image) { setUrl(''); return }
    if (image.url) { setUrl(image.url); return }
    if (!image.blob) { setUrl(''); return }
    const nextUrl = URL.createObjectURL(image.blob)
    setUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [image])
  return url
}
