import { useEffect, useState, type ClipboardEvent, type FormEvent } from 'react'
import { parseQuantity, type DisplayUnit } from '../../products/domain/product'
import type { Product } from '../../products/types'
import { imageFileFromClipboard, processRecipeImage } from '../image/process-recipe-image'
import type { CreateRecipeInput, Recipe, RecipeImageInput, UpdateRecipeInput } from '../types'
import { RecipeClassificationField } from './RecipeClassificationField'

type Row = { productId: string; quantity: string; unit: DisplayUnit }
type Props = { products: Product[]; recipe?: Recipe; onSubmit: (value: CreateRecipeInput | UpdateRecipeInput) => Promise<void>; error?: string }
const units = (unit: DisplayUnit): DisplayUnit[] => unit === 'g' ? ['g', 'kg'] : unit === 'ml' ? ['ml', 'l'] : ['pcs']

export function RecipeForm({ products, recipe, onSubmit, error }: Props) {
  const [name, setName] = useState(recipe?.name ?? '')
  const [instructions, setInstructions] = useState(recipe?.instructions ?? '')
  const [calories, setCalories] = useState(String(recipe?.caloriesPerServing ?? ''))
  const [protein, setProtein] = useState(String(recipe?.proteinGramsPerServing ?? ''))
  const [fat, setFat] = useState(String(recipe?.fatGramsPerServing ?? ''))
  const [carbs, setCarbs] = useState(String(recipe?.carbsGramsPerServing ?? ''))
  const [preparationTimeMin, setPreparationTimeMin] = useState(String(recipe?.preparationTimeMinMinutes ?? ''))
  const [preparationTimeMax, setPreparationTimeMax] = useState(String(recipe?.preparationTimeMaxMinutes ?? ''))
  const [classifications, setClassifications] = useState(recipe?.classifications ?? [])
  const [rows, setRows] = useState<Row[]>(recipe?.ingredients.map((item) => ({ productId: item.productId, quantity: String(item.enteredQuantity).replace('.', ','), unit: item.enteredUnit })) ?? [{ productId: '', quantity: '', unit: 'g' }])
  const [image, setImage] = useState<RecipeImageInput>()
  const [preview, setPreview] = useState<string>()
  const [message, setMessage] = useState<string>()
  const [pending, setPending] = useState(false)

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  const updateRow = (index: number, change: Partial<Row>) => setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...change } : row))
  const selectProduct = (index: number, productId: string) => {
    const product = products.find((item) => item.id === productId)
    updateRow(index, { productId, unit: product?.baseUnit ?? 'g' })
  }
  const selectImage = async (file?: File) => {
    if (!file) return
    try {
      const processed = await processRecipeImage(file)
      setImage(processed)
      setPreview((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(processed.blob) })
      setMessage(undefined)
    } catch (reason: unknown) { setMessage(reason instanceof Error ? reason.message : 'Не вдалося обробити фото') }
  }
  const pasteImage = (event: ClipboardEvent<HTMLFormElement>) => {
    const file = imageFileFromClipboard(event.clipboardData)
    if (!file) return
    event.preventDefault()
    void selectImage(file)
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setMessage(undefined)
    let ingredients
    try { ingredients = rows.map((row) => ({ productId: row.productId, enteredQuantity: parseQuantity(row.quantity), enteredUnit: row.unit })) } catch { setMessage('Перевірте кількість кожного продукту'); return }
    const optionalNumber = (value: string) => value.trim() ? Number(value.replace(',', '.')) : null
    if (!classifications.length) { setMessage('Оберіть хоча б одну категорію рецепту'); return }
    const base = { name, instructions, ingredients, classifications, caloriesPerServing: optionalNumber(calories), proteinGramsPerServing: optionalNumber(protein), fatGramsPerServing: optionalNumber(fat), carbsGramsPerServing: optionalNumber(carbs), preparationTimeMinMinutes: preparationTimeMin.trim() ? Number(preparationTimeMin) : null, preparationTimeMaxMinutes: preparationTimeMax.trim() ? Number(preparationTimeMax) : null }
    if (!recipe && !image) { setMessage('Додайте фото рецепту'); return }
    setPending(true)
    try { await onSubmit(recipe ? { ...base, ...(image ? { image } : {}) } : { ...base, image: image! }) } catch (reason: unknown) { setMessage(reason instanceof Error ? reason.message : 'Не вдалося зберегти рецепт') } finally { setPending(false) }
  }
  return <form className="recipe-form" onSubmit={submit} onPaste={pasteImage} noValidate>
    {(error || message) && <div className="form-alert" role="alert">{error ?? message}</div>}
    <label className="field">Назва рецепту<input value={name} onChange={(e) => setName(e.target.value)} /></label>
    <RecipeClassificationField value={classifications} onChange={setClassifications} />
    <fieldset className="nutrition-fieldset"><legend>Харчова цінність на 1 порцію</legend><div className="form-grid"><label className="field">Калорії, ккал<input inputMode="decimal" value={calories} onChange={(e) => setCalories(e.target.value)} /></label><label className="field">Білки, г<input inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} /></label><label className="field">Жири, г<input inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} /></label><label className="field">Вуглеводи, г<input inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} /></label></div></fieldset>
    <label className="field">Фото рецепту<input type="file" accept="image/*" onChange={(e) => void selectImage(e.target.files?.[0])} /><span className="field-hint">Оберіть файл або вставте скріншот через Ctrl+V. До 1600 px, до 2 MB після стиснення.</span></label>
    {preview && <img className="recipe-preview" src={preview} alt="Попередній перегляд рецепту" />}
    <fieldset className="ingredient-fieldset"><legend>Інгредієнти</legend>{rows.map((row, index) => { const product = products.find((item) => item.id === row.productId); return <div className="ingredient-row" key={`${row.productId}-${index}`}><label>Продукт<select value={row.productId} onChange={(e) => selectProduct(index, e.target.value)}><option value="">Оберіть продукт</option>{products.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Кількість<input inputMode="decimal" value={row.quantity} onChange={(e) => updateRow(index, { quantity: e.target.value })} /></label><label>Одиниця<select value={row.unit} onChange={(e) => updateRow(index, { unit: e.target.value as DisplayUnit })}>{units(product?.baseUnit ?? 'g').map((unit) => <option key={unit}>{unit}</option>)}</select></label><button type="button" className="button button-danger-ghost" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))} disabled={rows.length === 1}>Видалити</button></div> })}<button type="button" className="button button-secondary" onClick={() => setRows((current) => [...current, { productId: '', quantity: '', unit: 'g' }])}>+ Додати продукт</button></fieldset>
    <fieldset><legend>Час приготування, хвилини</legend><div className="form-grid"><label className="field">Від<input inputMode="numeric" value={preparationTimeMin} onChange={(e) => setPreparationTimeMin(e.target.value)} /><span className="field-hint">Необов’язково</span></label><label className="field">До<input inputMode="numeric" value={preparationTimeMax} onChange={(e) => setPreparationTimeMax(e.target.value)} /><span className="field-hint">Для точного часу повторіть значення</span></label></div></fieldset><label className="field">Спосіб приготування<textarea rows={8} value={instructions} onChange={(e) => setInstructions(e.target.value)} /></label>
    <button className="button button-primary" disabled={pending}>{pending ? 'Зберігаємо…' : 'Зберегти рецепт'}</button>
  </form>
}
