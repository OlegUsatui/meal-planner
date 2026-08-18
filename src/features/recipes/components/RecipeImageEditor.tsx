import { Check, Move, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { createRecipeCrop, moveRecipeCrop, processRecipeImage, resizeRecipeCrop, zoomRecipeCrop, clamp, type RecipeCropHandle, type RecipeImageCrop } from '../image/process-recipe-image'
import type { RecipeImageInput } from '../types'
import { Alert } from '../../../shared/ui/Alert'
import { Button, IconButton } from '../../../shared/ui/Button'

type Props = {
  file: File
  onApply: (image: RecipeImageInput & { blob: Blob }) => void
  onCancel: () => void
}

type Dimensions = { width: number; height: number }
type DragState = { mode: 'move' | 'resize'; startX: number; startY: number; crop: RecipeImageCrop; handle?: RecipeCropHandle }
const pendingCrop: RecipeImageCrop = { x: 0, y: 0, width: 1, height: 1 }
const handles: RecipeCropHandle[] = ['nw', 'ne', 'sw', 'se']

export function RecipeImageEditor({ file, onApply, onCancel }: Props) {
  const [crop, setCrop] = useState<RecipeImageCrop>(pendingCrop)
  const [dimensions, setDimensions] = useState<Dimensions>()
  const [previewUrl, setPreviewUrl] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | undefined>(undefined)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setDimensions(undefined)
    setCrop(pendingCrop)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const zoom = dimensions ? clamp(createRecipeCrop(dimensions.width, dimensions.height).width / crop.width, 1, 3) : 1
  const reset = () => { if (dimensions) setCrop(createRecipeCrop(dimensions.width, dimensions.height)); setError(undefined) }
  const point = (event: PointerEvent): { x: number; y: number } => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect?.width || !rect.height) return { x: 0, y: 0 }
    return { x: clamp((event.clientX - rect.left) / rect.width, 0, 1), y: clamp((event.clientY - rect.top) / rect.height, 0, 1) }
  }
  const startDrag = (event: PointerEvent<HTMLElement>, mode: DragState['mode'], handle?: RecipeCropHandle) => {
    if (!dimensions) return
    event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId)
    const current = point(event)
    dragRef.current = { mode, startX: current.x, startY: current.y, crop, handle }
  }
  const drag = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragRef.current
    if (!start || !dimensions) return
    const current = point(event)
    if (start.mode === 'move') setCrop(moveRecipeCrop(start.crop, current.x - start.startX, current.y - start.startY))
    else if (start.handle) setCrop(resizeRecipeCrop(start.crop, start.handle, current.x, current.y, dimensions.width, dimensions.height))
  }
  const moveEnd = () => { dragRef.current = undefined }
  const moveWithKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    event.preventDefault()
    const step = event.shiftKey ? 0.05 : 0.01
    setCrop((current) => moveRecipeCrop(current, event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0, event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0))
  }
  const setZoom = (value: number) => { if (dimensions) setCrop((current) => zoomRecipeCrop(current, value, dimensions.width, dimensions.height)) }
  const apply = async () => {
    if (!dimensions) return
    setPending(true); setError(undefined)
    try { onApply(await processRecipeImage(file, crop)) }
    catch (reason: unknown) { setError(reason instanceof Error ? reason.message : 'Не вдалося обробити фото') }
    finally { setPending(false) }
  }

  return <section className="recipe-image-editor" aria-labelledby="recipe-image-editor-title">
    <div className="recipe-image-editor-header"><div><p className="eyebrow">Кадрування фото</p><h3 id="recipe-image-editor-title">Налаштуйте кадр 4:3</h3></div><IconButton aria-label="Скасувати редагування фото" onClick={onCancel} disabled={pending}><X aria-hidden="true" /></IconButton></div>
    <div className="recipe-image-workspace"><div ref={canvasRef} className="recipe-image-canvas" onPointerMove={drag} onPointerUp={moveEnd} onPointerCancel={moveEnd}>
      {previewUrl && <img className="recipe-image-source" src={previewUrl} alt="" draggable="false" onLoad={(event) => { const next = { width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight }; setDimensions(next); setCrop(createRecipeCrop(next.width, next.height)) }} />}
      {dimensions && <div className="recipe-image-selection" role="group" aria-label="Рамка обрізання 4:3" tabIndex={0} onKeyDown={moveWithKeyboard} onPointerDown={(event) => startDrag(event, 'move')} style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.width * 100}%`, height: `${crop.height * 100}%` }}><span className="recipe-image-grid" aria-hidden="true" />{handles.map((handle) => <span className={`recipe-image-handle handle-${handle}`} aria-hidden="true" key={handle} onPointerDown={(event) => startDrag(event, 'resize', handle)} />)}</div>}
    </div></div>
    <p className="field-hint"><Move aria-hidden="true" /> Перетягніть рамку, змініть її розмір за кути або скористайтеся масштабом.</p>
    <div className="recipe-image-editor-lower"><div><span className="recipe-image-preview-label">Фінальний вигляд</span><div className="recipe-image-final-preview" role="img" aria-label="Попередній перегляд фінального фото">{previewUrl && dimensions && <img src={previewUrl} alt="" draggable="false" style={{ width: `${100 / crop.width}%`, height: `${100 / crop.height}%`, left: `${-crop.x / crop.width * 100}%`, top: `${-crop.y / crop.height * 100}%` }} />}</div></div>
      <div className="recipe-image-zoom"><span id="recipe-image-zoom-label">Масштаб фото</span><span className="recipe-image-zoom-controls"><IconButton aria-label="Зменшити фото" onClick={() => setZoom(zoom - 0.1)} disabled={pending || !dimensions || zoom <= 1}><ZoomOut aria-hidden="true" /></IconButton><input type="range" min="1" max="3" step="0.05" value={zoom} aria-labelledby="recipe-image-zoom-label" onChange={(event) => setZoom(Number(event.target.value))} disabled={pending || !dimensions} /><IconButton aria-label="Збільшити фото" onClick={() => setZoom(zoom + 0.1)} disabled={pending || !dimensions || zoom >= 3}><ZoomIn aria-hidden="true" /></IconButton></span></div>
    </div>
    {error && <Alert variant="error">{error}</Alert>}
    <div className="recipe-image-editor-actions"><Button variant="secondary" onClick={reset} disabled={pending || !dimensions}><RotateCcw aria-hidden="true" /> Скинути</Button><div><Button variant="secondary" onClick={onCancel} disabled={pending}>Скасувати</Button><Button onClick={() => void apply()} disabled={pending || !dimensions}><Check aria-hidden="true" /> {pending ? 'Обробляємо…' : 'Застосувати фото'}</Button></div></div>
  </section>
}
