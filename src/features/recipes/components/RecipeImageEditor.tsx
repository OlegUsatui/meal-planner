import { Check, Move, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { processRecipeImage, clamp, type RecipeImageCrop } from '../image/process-recipe-image'
import type { RecipeImageInput } from '../types'
import { Alert } from '../../../shared/ui/Alert'
import { Button, IconButton } from '../../../shared/ui/Button'

type Props = {
  file: File
  onApply: (image: RecipeImageInput & { blob: Blob }) => void
  onCancel: () => void
}

const initialCrop: RecipeImageCrop = { zoom: 1, offsetX: 0, offsetY: 0 }

export function RecipeImageEditor({ file, onApply, onCancel }: Props) {
  const [crop, setCrop] = useState<RecipeImageCrop>(initialCrop)
  const [previewUrl, setPreviewUrl] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | undefined>(undefined)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const reset = () => { setCrop(initialCrop); setError(undefined) }
  const moveStart = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY, offsetX: crop.offsetX, offsetY: crop.offsetY }
  }
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragRef.current
    if (!start) return
    const rect = event.currentTarget.getBoundingClientRect()
    setCrop((current) => ({ ...current, offsetX: clamp(start.offsetX + (event.clientX - start.x) / rect.width * 2, -1, 1), offsetY: clamp(start.offsetY + (event.clientY - start.y) / rect.height * 2, -1, 1) }))
  }
  const moveEnd = () => { dragRef.current = undefined }
  const apply = async () => {
    setPending(true); setError(undefined)
    try { onApply(await processRecipeImage(file, crop)) }
    catch (reason: unknown) { setError(reason instanceof Error ? reason.message : 'Не вдалося обробити фото') }
    finally { setPending(false) }
  }

  return <section className="recipe-image-editor" aria-labelledby="recipe-image-editor-title">
    <div className="recipe-image-editor-header"><div><p className="eyebrow">Кадрування фото</p><h3 id="recipe-image-editor-title">Налаштуйте кадр 4:3</h3></div><IconButton aria-label="Скасувати редагування фото" onClick={onCancel} disabled={pending}><X aria-hidden="true" /></IconButton></div>
    <div className="recipe-image-crop-frame" onPointerDown={moveStart} onPointerMove={move} onPointerUp={moveEnd} onPointerCancel={moveEnd} role="img" aria-label="Попередній перегляд кадру фото"><img src={previewUrl} alt="" draggable="false" style={{ objectPosition: `${50 + crop.offsetX * 50}% ${50 + crop.offsetY * 50}%`, transform: `scale(${crop.zoom})` }} /><span className="recipe-image-crop-guide" aria-hidden="true" /></div>
    <p className="field-hint"><Move aria-hidden="true" /> Перетягніть фото, щоб змінити композицію. У фінальному варіанті буде кадр 4:3.</p>
    <label className="recipe-image-zoom"><span>Масштаб</span><span className="recipe-image-zoom-controls"><IconButton aria-label="Зменшити фото" onClick={() => setCrop((current) => ({ ...current, zoom: clamp(current.zoom - 0.1, 1, 3) }))} disabled={pending || crop.zoom <= 1}><ZoomOut aria-hidden="true" /></IconButton><input type="range" min="1" max="3" step="0.05" value={crop.zoom} aria-label="Масштаб фото" onChange={(event) => setCrop((current) => ({ ...current, zoom: Number(event.target.value) }))} disabled={pending} /><IconButton aria-label="Збільшити фото" onClick={() => setCrop((current) => ({ ...current, zoom: clamp(current.zoom + 0.1, 1, 3) }))} disabled={pending || crop.zoom >= 3}><ZoomIn aria-hidden="true" /></IconButton></span></label>
    {error && <Alert variant="error">{error}</Alert>}
    <div className="recipe-image-editor-actions"><Button variant="secondary" onClick={reset} disabled={pending}><RotateCcw aria-hidden="true" /> Скинути</Button><div><Button variant="secondary" onClick={onCancel} disabled={pending}>Скасувати</Button><Button onClick={() => void apply()} disabled={pending || !previewUrl}><Check aria-hidden="true" /> {pending ? 'Обробляємо…' : 'Застосувати фото'}</Button></div></div>
  </section>
}
