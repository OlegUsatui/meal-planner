import { Pencil, Soup } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { formatPreparationTime, validateRecipeInput, type RecipeValidationErrors } from '../domain/recipe'
import { type RecipeClassification } from '../domain/recipe-taxonomy'
import { RecipeClassificationField } from './RecipeClassificationField'
import { RecipeImageDialog } from './RecipeImageDialog'
import { InlineEditButton, InlineEditorActions } from './InlineEditorActions'
import { optionalNumber, recipeErrorMessage, type RecipeBlockPatch } from './recipe-editing'
import type { Recipe, RecipeImageInput } from '../types'
import { FormField } from '../../../shared/ui/FormField'
import { MediaPlaceholder } from '../../../shared/ui/MediaPlaceholder'
import { Alert } from '../../../shared/ui/Alert'
import { IconButton } from '../../../shared/ui/Button'

type Props = { recipe: Recipe; canManage: boolean; editing: boolean; blocked: boolean; onEdit: () => void; onCancel: () => void; onSave: (patch: RecipeBlockPatch) => Promise<void>; actions?: ReactNode }

export function RecipeHeroBlock({ recipe, canManage, editing, blocked, onEdit, onCancel, onSave, actions }: Props) {
  const [name, setName] = useState(recipe.name)
  const [classifications, setClassifications] = useState<RecipeClassification[]>(recipe.classifications)
  const [preparationTime, setPreparationTime] = useState(String(recipe.preparationTimeMinMinutes ?? ''))
  const [preparationTimeMax, setPreparationTimeMax] = useState(String(recipe.preparationTimeMaxMinutes ?? ''))
  const [timeRange, setTimeRange] = useState(recipe.preparationTimeMinMinutes !== recipe.preparationTimeMaxMinutes)
  const [image, setImage] = useState<RecipeImageInput | null | undefined>()
  const [imageOpen, setImageOpen] = useState(false)
  const [errors, setErrors] = useState<RecipeValidationErrors>({})
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const activeImage = image === undefined ? recipe.image : image
  const imageUrl = useImageUrl(activeImage)

  useEffect(() => { if (!editing) resetDraft() }, [editing, recipe.updatedAt])
  const resetDraft = () => { setName(recipe.name); setClassifications(recipe.classifications); setPreparationTime(String(recipe.preparationTimeMinMinutes ?? '')); setPreparationTimeMax(String(recipe.preparationTimeMaxMinutes ?? '')); setTimeRange(recipe.preparationTimeMinMinutes !== recipe.preparationTimeMaxMinutes); setImage(undefined); setErrors({}); setMessage(''); setImageOpen(false) }
  const openPhotoEditor = () => { if (!editing) onEdit(); setImageOpen(true) }
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setMessage('')
    const exact = optionalNumber(preparationTime)
    const patch: RecipeBlockPatch = { name, classifications, preparationTimeMinMinutes: exact, preparationTimeMaxMinutes: timeRange ? optionalNumber(preparationTimeMax) : exact }
    const validation = validateRecipeInput({ name, instructions: recipe.instructions, ingredients: recipe.ingredients.map(({ productId, enteredQuantity, enteredUnit }) => ({ productId, enteredQuantity, enteredUnit })), classifications, caloriesPerServing: recipe.caloriesPerServing, proteinGramsPerServing: recipe.proteinGramsPerServing, fatGramsPerServing: recipe.fatGramsPerServing, carbsGramsPerServing: recipe.carbsGramsPerServing, preparationTimeMinMinutes: patch.preparationTimeMinMinutes!, preparationTimeMaxMinutes: patch.preparationTimeMaxMinutes! })
    setErrors(validation)
    if (validation.name || validation.classifications || validation.preparationTime) return
    if (image !== undefined) patch.image = image
    setPending(true)
    try { await onSave(patch) } catch (error: unknown) { setMessage(recipeErrorMessage(error)) } finally { setPending(false) }
  }
  const heroActions = <div className="recipe-hero-actions" role="group" aria-label="Дії рецепту">
    {canManage && !editing && <InlineEditButton label="Редагувати основну інформацію" disabled={blocked} onClick={onEdit} />}
    {actions}
  </div>

  const editorView = <form className="recipe-detail-hero-copy inline-editor-card" onSubmit={(event) => void submit(event)} noValidate>
    {heroActions}
    <div className="inline-editor-heading"><p className="eyebrow">Редагування основної інформації</p><h1>{recipe.name}</h1></div>
    <FormField label="Назва рецепту" error={errors.name} control={<input value={name} onChange={(event) => setName(event.target.value)} />} />
    <RecipeClassificationField value={classifications} onChange={setClassifications} />
    {errors.classifications && <span className="field-error">{errors.classifications}</span>}
    <fieldset className="time-fieldset"><legend>Час приготування</legend><div className="form-grid"><FormField label={timeRange ? 'Від, хв' : 'Точний час, хв'} control={<input inputMode="numeric" value={preparationTime} onChange={(event) => setPreparationTime(event.target.value)} />} />{timeRange && <FormField label="До, хв" control={<input inputMode="numeric" value={preparationTimeMax} onChange={(event) => setPreparationTimeMax(event.target.value)} />} />}</div><label className="switch-field"><input type="checkbox" checked={timeRange} onChange={(event) => setTimeRange(event.target.checked)} /> Вказати діапазон часу</label></fieldset>
    {errors.preparationTime && <span className="field-error">{errors.preparationTime}</span>}{message && <Alert variant="error">{message}</Alert>}
    <InlineEditorActions saveLabel="Зберегти основну інформацію" pending={pending} onCancel={onCancel} />
  </form>
  const [titleAccent, ...titleRemainder] = recipe.name.trim().split(/\s+/)
  const preparationTimeLabel = formatPreparationTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes)
  const readView = <div className="recipe-detail-hero-copy">
    {heroActions}
    <h1 className="recipe-poster-title"><span className="recipe-title-accent">{titleAccent}</span>{titleRemainder.length > 0 && <> {' '}<span className="recipe-title-rest">{titleRemainder.join(' ')}</span></>}</h1>
    {preparationTimeLabel && <div className="recipe-time-badge"><span>Час приготування</span><strong>{preparationTimeLabel}</strong></div>}
  </div>

  return <div className={`recipe-detail-hero${editing ? ' is-editing' : ''}`}>
    {editing ? editorView : readView}
    <div className="recipe-detail-hero-media recipe-poster-media" style={{ aspectRatio: '4 / 3', alignSelf: 'start' }}><div className="recipe-image-edit-trigger"><MediaPlaceholder src={imageUrl} alt={`Фото страви ${recipe.name}`} fallback={<><Soup aria-hidden="true" /><span>Страва без фото</span></>} fallbackLabel="Фото недоступне" className="recipe-hero recipe-media-4x3" />{canManage && <IconButton className="recipe-photo-edit-button" aria-label="Редагувати фото" title="Редагувати фото" disabled={blocked} onClick={openPhotoEditor}><Pencil aria-hidden="true" /></IconButton>}</div></div>
    {imageOpen && <RecipeImageDialog image={activeImage} onClose={() => setImageOpen(false)} onApply={(nextImage) => { setImage(nextImage); setImageOpen(false) }} onRemove={() => { setImage(null); setImageOpen(false) }} />}
  </div>
}

function useImageUrl(image: RecipeImageInput | null): string {
  const [url, setUrl] = useState('')
  useEffect(() => { if (!image) { setUrl(''); return } if (image.url) { setUrl(image.url); return } if (!image.blob) { setUrl(''); return } const nextUrl = URL.createObjectURL(image.blob); setUrl(nextUrl); return () => URL.revokeObjectURL(nextUrl) }, [image])
  return url
}
