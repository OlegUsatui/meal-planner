import { ImageMinus, Soup } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { RecipeImageEditor } from './RecipeImageEditor'
import type { RecipeImageInput } from '../types'

type Props = { image: RecipeImageInput | null; onApply: (image: RecipeImageInput) => void; onRemove: () => void; onClose: () => void }

export function RecipeImageDialog({ image, onApply, onRemove, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const [file, setFile] = useState<File>()
  const imageUrl = useImageUrl(image)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const buttons = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button, input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [])].filter((element) => !element.hasAttribute('disabled'))
      const first = buttons[0]; const last = buttons.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => { document.removeEventListener('keydown', handleKeyDown); previous?.focus() }
  }, [onClose])

  return <div className="recipe-image-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div ref={dialogRef} className="recipe-image-dialog" role="dialog" aria-modal="true" aria-labelledby="recipe-image-dialog-title">
      {file ? <><h2 id="recipe-image-dialog-title" className="sr-only">Редагування фото</h2><RecipeImageEditor file={file} onApply={onApply} onCancel={() => setFile(undefined)} /></> : <>
        <div className="recipe-image-dialog-header"><div><p className="eyebrow">Фото рецепту</p><h2 id="recipe-image-dialog-title">Редагування фото</h2></div><button ref={closeRef} type="button" className="icon-button" aria-label="Скасувати редагування фото" onClick={onClose}>×</button></div>
        {imageUrl ? <img className="recipe-image-dialog-preview" src={imageUrl} alt="Поточне фото рецепту" /> : <div className="recipe-image-dialog-empty" role="img" aria-label="Фото недоступне"><Soup aria-hidden="true" /><span>Фото ще не додано</span></div>}
        <label className="button button-secondary recipe-image-file-button">Оберіть нове фото<input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0])} /></label>
        <div className="dialog-actions"><button type="button" className="button button-secondary" onClick={onClose}>Скасувати</button>{image && <button type="button" className="button button-danger-ghost" onClick={onRemove}><ImageMinus aria-hidden="true" /> Прибрати фото</button>}</div>
      </>}
    </div>
  </div>
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
