import { ClipboardPaste, ImageMinus, Soup, Upload } from 'lucide-react'
import { MediaPlaceholder } from '../../../shared/ui/MediaPlaceholder'
import { Button } from '../../../shared/ui/Button'

interface RecipePhotoCardProps {
  imageUrl?: string
  onSelect: (file: File) => void
  onRemove?: () => void
  disabled?: boolean
}

export function RecipePhotoCard({ imageUrl, onSelect, onRemove, disabled = false }: RecipePhotoCardProps) {
  return <div className="recipe-photo-card">
    <MediaPlaceholder src={imageUrl} alt={imageUrl ? 'Поточне фото рецепту' : ''} fallback={<><Soup aria-hidden="true" /><span>Фото ще не додано</span></>} fallbackLabel="Фото рецепту відсутнє" className="recipe-photo-card-media recipe-media-4x3" />
    <p className="recipe-photo-paste-hint"><ClipboardPaste aria-hidden="true" /> Вставте скріншот через <kbd>Ctrl</kbd> + <kbd>V</kbd> або <kbd>⌘</kbd> + <kbd>V</kbd></p>
    <div className="recipe-photo-card-actions">
      <label className={`button button-secondary recipe-photo-file-button ${disabled ? 'disabled' : ''}`.trim()}><Upload aria-hidden="true" /> {imageUrl ? 'Замінити фото' : 'Завантажити фото'}<input type="file" accept="image/*" disabled={disabled} onChange={(event) => { const file = event.target.files?.[0]; if (file) onSelect(file); event.currentTarget.value = '' }} /></label>
      {imageUrl && onRemove && <Button variant="danger-ghost" onClick={onRemove} disabled={disabled}><ImageMinus aria-hidden="true" /> Прибрати фото</Button>}
    </div>
  </div>
}
