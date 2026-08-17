import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent } from 'react'
import { ImageMinus, Plus, Trash2 } from 'lucide-react'
import { parseQuantity, type DisplayUnit } from '../../products/domain/product'
import type { Product } from '../../products/types'
import { hasRecipeValidationErrors, validateRecipeInput, type RecipeValidationErrors } from '../domain/recipe'
import type { RecipeClassification } from '../domain/recipe-taxonomy'
import { imageFileFromClipboard } from '../image/process-recipe-image'
import type { CreateRecipeInput, RecipeImageInput } from '../types'
import { RecipeClassificationField } from './RecipeClassificationField'
import { RecipeImageEditor } from './RecipeImageEditor'

type Row = { key: string; productId: string; quantity: string; unit: DisplayUnit }
type Props = { products: Product[]; onSubmit: (value: CreateRecipeInput) => Promise<void>; error?: string }
const units = (unit: DisplayUnit): DisplayUnit[] => unit === 'g' ? ['g', 'kg'] : unit === 'ml' ? ['ml', 'l'] : ['pcs']
const newRow = (): Row => ({ key: crypto.randomUUID(), productId: '', quantity: '', unit: 'g' })

export function RecipeForm({ products, onSubmit, error }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [instructions, setInstructions] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [carbs, setCarbs] = useState('')
  const [preparationTime, setPreparationTime] = useState('')
  const [preparationTimeMax, setPreparationTimeMax] = useState('')
  const [timeRange, setTimeRange] = useState(false)
  const [classifications, setClassifications] = useState<RecipeClassification[]>([])
  const [rows, setRows] = useState<Row[]>([newRow()])
  const [image, setImage] = useState<RecipeImageInput>()
  const [imageFile, setImageFile] = useState<File>()
  const [preview, setPreview] = useState<string>()
  const [message, setMessage] = useState<string>()
  const [errors, setErrors] = useState<RecipeValidationErrors>({})
  const [pending, setPending] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => { const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty && !pending) event.preventDefault() }; window.addEventListener('beforeunload', beforeUnload); return () => window.removeEventListener('beforeunload', beforeUnload) }, [dirty, pending])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  const change = <T,>(setter: (value: T) => void, value: T) => { setter(value); setDirty(true) }
  const updateRow = (index: number, update: Partial<Row>) => { setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...update } : row)); setDirty(true) }
  const selectProduct = (index: number, productId: string) => { const product = products.find((item) => item.id === productId); updateRow(index, { productId, unit: product?.baseUnit ?? 'g' }) }
  const selectImage = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setMessage('Оберіть файл зображення'); return }
    setImageFile(file); setMessage(undefined)
  }
  const applyImage = (processed: RecipeImageInput & { blob: Blob }) => { setImage(processed); setImageFile(undefined); if (imageInputRef.current) imageInputRef.current.value = ''; setPreview((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(processed.blob) }); setMessage(undefined); setDirty(true) }
  const cancelImageEditor = () => { setImageFile(undefined); if (imageInputRef.current) imageInputRef.current.value = '' }
  const pasteImage = (event: ClipboardEvent<HTMLFormElement>) => { const file = imageFileFromClipboard(event.clipboardData); if (!file) return; event.preventDefault(); selectImage(file) }
  const optionalNumber = (value: string) => value.trim() ? Number(value.replace(',', '.')) : null
  const ingredients = () => rows.map((row) => { try { return { productId: row.productId, enteredQuantity: parseQuantity(row.quantity), enteredUnit: row.unit } } catch { return { productId: row.productId, enteredQuantity: Number.NaN, enteredUnit: row.unit } } })
  const focusFirstError = (nextErrors: RecipeValidationErrors) => { const order: Array<keyof RecipeValidationErrors> = ['name', 'classifications', 'ingredients', 'nutrition', 'preparationTime', 'instructions']; const first = order.find((key) => nextErrors[key]); formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus() }
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setMessage(undefined)
    const exact = optionalNumber(preparationTime)
    const base = { name, instructions, ingredients: ingredients(), classifications, caloriesPerServing: optionalNumber(calories), proteinGramsPerServing: optionalNumber(protein), fatGramsPerServing: optionalNumber(fat), carbsGramsPerServing: optionalNumber(carbs), preparationTimeMinMinutes: exact, preparationTimeMaxMinutes: timeRange ? optionalNumber(preparationTimeMax) : exact }
    const nextErrors = validateRecipeInput(base); setErrors(nextErrors)
    if (hasRecipeValidationErrors(nextErrors)) { focusFirstError(nextErrors); return }
    setPending(true)
    try { await onSubmit({ ...base, image: image ?? null }); setDirty(false) }
    catch (reason: unknown) { setMessage(reason instanceof Error ? reason.message : 'Не вдалося зберегти рецепт') }
    finally { setPending(false) }
  }

  return <form ref={formRef} className="recipe-form progressive-form" onSubmit={submit} onPaste={pasteImage} noValidate>
    {(error || message || hasRecipeValidationErrors(errors)) && <div className="form-alert error-summary" role="alert"><strong>Перевірте форму</strong><span>{error ?? message ?? Object.values(errors)[0]}</span></div>}
    <section className="form-section"><p className="eyebrow">Основне</p><label className="field">Назва рецепту <span aria-hidden="true">*</span><input data-field="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'recipe-name-error' : undefined} value={name} onChange={(event) => change(setName, event.target.value)} /></label>{errors.name && <span id="recipe-name-error" className="field-error">{errors.name}</span>}</section>
    <section className="form-section"><p className="eyebrow">Категоризація</p><div tabIndex={-1} data-field="classifications"><RecipeClassificationField value={classifications} onChange={(value) => change(setClassifications, value)} /></div>{errors.classifications && <span className="field-error">{errors.classifications}</span>}</section>
    <section className="form-section"><p className="eyebrow">Інгредієнти</p><fieldset className="ingredient-fieldset" tabIndex={-1} data-field="ingredients"><legend className="sr-only">Інгредієнти рецепту</legend>{rows.map((row, index) => { const product = products.find((item) => item.id === row.productId); return <div className="ingredient-row" key={row.key}><label>Продукт<select value={row.productId} onChange={(event) => selectProduct(index, event.target.value)}><option value="">Оберіть продукт</option>{products.filter((item) => !item.archivedAt).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Кількість<input inputMode="decimal" value={row.quantity} onChange={(event) => updateRow(index, { quantity: event.target.value })} /></label><label>Одиниця<select value={row.unit} onChange={(event) => updateRow(index, { unit: event.target.value as DisplayUnit })}>{units(product?.baseUnit ?? 'g').map((unit) => <option key={unit}>{unit}</option>)}</select></label><button type="button" className="icon-button danger" aria-label={`Видалити інгредієнт ${index + 1}`} onClick={() => { setRows((current) => current.filter((_, rowIndex) => rowIndex !== index)); setDirty(true) }} disabled={rows.length === 1}><Trash2 aria-hidden="true" /></button></div>})}<button type="button" className="button button-secondary" onClick={() => { setRows((current) => [...current, newRow()]); setDirty(true) }}><Plus aria-hidden="true" /> Додати продукт</button></fieldset>{errors.ingredients && <span className="field-error">{errors.ingredients}</span>}</section>
    <section className="form-section optional-section"><p className="eyebrow">Деталі · необов’язково</p><fieldset className="nutrition-fieldset" tabIndex={-1} data-field="nutrition"><legend>Харчова цінність на 1 порцію</legend><div className="form-grid"><NumberField label="Калорії, ккал" value={calories} onChange={(value) => change(setCalories, value)} /><NumberField label="Білки, г" value={protein} onChange={(value) => change(setProtein, value)} /><NumberField label="Жири, г" value={fat} onChange={(value) => change(setFat, value)} /><NumberField label="Вуглеводи, г" value={carbs} onChange={(value) => change(setCarbs, value)} /></div>{errors.nutrition && <span className="field-error">{errors.nutrition}</span>}</fieldset>
      <fieldset className="time-fieldset" tabIndex={-1} data-field="preparationTime"><legend>Час приготування</legend><div className="form-grid"><label className="field">{timeRange ? 'Від, хв' : 'Точний час, хв'}<input inputMode="numeric" value={preparationTime} onChange={(event) => change(setPreparationTime, event.target.value)} /></label>{timeRange && <label className="field">До, хв<input inputMode="numeric" value={preparationTimeMax} onChange={(event) => change(setPreparationTimeMax, event.target.value)} /></label>}</div><label className="switch-field"><input type="checkbox" checked={timeRange} onChange={(event) => change(setTimeRange, event.target.checked)} /> Вказати діапазон часу</label>{errors.preparationTime && <span className="field-error">{errors.preparationTime}</span>}</fieldset>
      <label className="field">Фото рецепту <span className="optional-label">необов’язково</span><input ref={imageInputRef} type="file" accept="image/*" onChange={(event) => selectImage(event.target.files?.[0])} /><span className="field-hint">Оберіть файл або вставте скріншот через Ctrl+V. Після вибору налаштуйте кадр 4:3.</span></label>{imageFile ? <RecipeImageEditor file={imageFile} onApply={applyImage} onCancel={cancelImageEditor} /> : preview && <div className="recipe-image-edit"><img className="recipe-preview" src={preview} alt="Поточне фото рецепту" /><button type="button" className="button button-danger-ghost" onClick={() => { setImage(undefined); setPreview(undefined); setDirty(true) }}><ImageMinus aria-hidden="true" /> Прибрати фото</button></div>}</section>
    <section className="form-section"><p className="eyebrow">Приготування</p><label className="field">Спосіб приготування <span aria-hidden="true">*</span><textarea data-field="instructions" aria-invalid={Boolean(errors.instructions)} aria-describedby={errors.instructions ? 'recipe-instructions-error' : undefined} rows={10} value={instructions} onChange={(event) => change(setInstructions, event.target.value)} /></label>{errors.instructions && <span id="recipe-instructions-error" className="field-error">{errors.instructions}</span>}</section>
    <div className="sticky-save"><span>{dirty ? 'Є незбережені зміни' : 'Усі зміни збережено'}</span><button className="button button-primary" disabled={pending}>{pending ? 'Зберігаємо…' : 'Зберегти рецепт'}</button></div>
  </form>
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="field">{label}<input inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} /></label> }
