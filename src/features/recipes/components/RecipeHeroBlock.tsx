import { Clock3, Pencil, Soup } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { formatPreparationTime, validateRecipeInput, type RecipeValidationErrors } from '../domain/recipe'
import { getRecipeSubcategory, recipeMealTypes, type RecipeClassification } from '../domain/recipe-taxonomy'
import { RecipeClassificationField } from './RecipeClassificationField'
import { RecipeImageDialog } from './RecipeImageDialog'
import { InlineEditButton, InlineEditorActions } from './InlineEditorActions'
import { optionalNumber, recipeErrorMessage, type RecipeBlockPatch } from './recipe-editing'
import type { Recipe, RecipeImageInput } from '../types'

type Props = { recipe: Recipe; canManage: boolean; editing: boolean; blocked: boolean; planned?: boolean; onEdit: () => void; onCancel: () => void; onSave: (patch: RecipeBlockPatch) => Promise<void>; planAction?: ReactNode }

export function RecipeHeroBlock({ recipe, canManage, editing, blocked, planned = false, onEdit, onCancel, onSave, planAction }: Props) {
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
  const [imageError, setImageError] = useState(false)
  const activeImage = image === undefined ? recipe.image : image
  const imageUrl = useImageUrl(activeImage)

  useEffect(() => { if (!editing) resetDraft() }, [editing, recipe.updatedAt])
  useEffect(() => setImageError(false), [imageUrl])
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

  return <div className="recipe-detail-hero">
    <div className="recipe-detail-hero-media"><div className="recipe-image-edit-trigger">{imageUrl && !imageError ? <img className="recipe-hero" src={imageUrl} alt={`Фото страви ${recipe.name}`} onError={() => setImageError(true)} /> : <div className="recipe-image-placeholder recipe-hero" role="img" aria-label="Фото недоступне"><Soup aria-hidden="true" /><span>Страва без фото</span></div>}{canManage && <button type="button" className="button button-secondary recipe-photo-edit-button" disabled={blocked} onClick={openPhotoEditor}><Pencil aria-hidden="true" /> Редагувати фото</button>}</div></div>
    {editing ? <form className="recipe-detail-hero-copy inline-editor-card" onSubmit={(event) => void submit(event)} noValidate><div className="inline-editor-heading"><p className="eyebrow">Редагування основної інформації</p><h1>{recipe.name}</h1></div><label className="field">Назва рецепту<input value={name} aria-invalid={Boolean(errors.name)} onChange={(event) => setName(event.target.value)} /></label>{errors.name && <span className="field-error">{errors.name}</span>}<RecipeClassificationField value={classifications} onChange={setClassifications} />{errors.classifications && <span className="field-error">{errors.classifications}</span>}<fieldset className="time-fieldset"><legend>Час приготування</legend><div className="form-grid"><label className="field">{timeRange ? 'Від, хв' : 'Точний час, хв'}<input inputMode="numeric" value={preparationTime} onChange={(event) => setPreparationTime(event.target.value)} /></label>{timeRange && <label className="field">До, хв<input inputMode="numeric" value={preparationTimeMax} onChange={(event) => setPreparationTimeMax(event.target.value)} /></label>}</div><label className="switch-field"><input type="checkbox" checked={timeRange} onChange={(event) => setTimeRange(event.target.checked)} /> Вказати діапазон часу</label></fieldset>{errors.preparationTime && <span className="field-error">{errors.preparationTime}</span>}{message && <div className="form-alert" role="alert">{message}</div>}<InlineEditorActions saveLabel="Зберегти основну інформацію" pending={pending} onCancel={onCancel} />{planAction}</form> : <div className="recipe-detail-hero-copy"><p className="eyebrow">{planned ? 'Запланована страва' : recipe.isSystem ? 'Системний рецепт' : 'Ваш рецепт'}</p><h1>{recipe.name}</h1><div className="recipe-category-badges">{recipe.classifications.length ? recipe.classifications.map((item) => <span key={`${item.mealType}:${item.subcategoryId}`}>{recipeMealTypes.find((type) => type.value === item.mealType)?.label}: {getRecipeSubcategory(item.subcategoryId)?.label}</span>) : <span>Без категорії</span>}</div><div className="recipe-meta-row"><span><Clock3 aria-hidden="true" /> {formatPreparationTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes) ?? 'Час не вказано'}</span><span>На 1 порцію</span></div>{canManage && <InlineEditButton label="Редагувати основну інформацію" disabled={blocked} onClick={onEdit} />}{planAction}</div>}
    {imageOpen && <RecipeImageDialog image={activeImage} onClose={() => setImageOpen(false)} onApply={(nextImage) => { setImage(nextImage); setImageOpen(false) }} onRemove={() => { setImage(null); setImageOpen(false) }} />}
  </div>
}

function useImageUrl(image: RecipeImageInput | null): string {
  const [url, setUrl] = useState('')
  useEffect(() => { if (!image) { setUrl(''); return } if (image.url) { setUrl(image.url); return } if (!image.blob) { setUrl(''); return } const nextUrl = URL.createObjectURL(image.blob); setUrl(nextUrl); return () => URL.revokeObjectURL(nextUrl) }, [image])
  return url
}
