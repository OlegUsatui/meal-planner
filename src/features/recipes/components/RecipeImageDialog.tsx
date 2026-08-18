import { ImageMinus, Soup } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RecipeImageEditor } from './RecipeImageEditor'
import type { RecipeImageInput } from '../types'
import { Dialog } from '../../../shared/ui/Dialog'
import { Button, IconButton } from '../../../shared/ui/Button'

type Props = { image: RecipeImageInput | null; onApply: (image: RecipeImageInput) => void; onRemove: () => void; onClose: () => void }

export function RecipeImageDialog({ image, onApply, onRemove, onClose }: Props) {
  const [file, setFile] = useState<File>()
  const imageUrl = useImageUrl(image)
  return <Dialog eyebrow="Фото рецепту" title="Редагування фото" titleId="recipe-image-dialog-title" className="recipe-image-dialog" backdropClassName="recipe-image-dialog-backdrop" onClose={onClose} actions={file ? undefined : <><Button variant="secondary" onClick={onClose}>Скасувати</Button>{image && <Button variant="danger-ghost" onClick={onRemove}><ImageMinus aria-hidden="true" /> Прибрати фото</Button>}</>}>
    {file ? <RecipeImageEditor file={file} onApply={onApply} onCancel={() => setFile(undefined)} /> : <><div className="recipe-image-dialog-header"><span aria-hidden="true" /><IconButton aria-label="Скасувати редагування фото" onClick={onClose}>×</IconButton></div><div className="recipe-image-dialog-preview-wrap">{imageUrl ? <img className="recipe-image-dialog-preview" src={imageUrl} alt="Поточне фото рецепту" /> : <div className="recipe-image-dialog-empty" role="img" aria-label="Фото недоступне"><Soup aria-hidden="true" /><span>Фото ще не додано</span></div>}</div><label className="button button-secondary recipe-image-file-button">Оберіть нове фото<input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0])} /></label></>}
  </Dialog>
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
