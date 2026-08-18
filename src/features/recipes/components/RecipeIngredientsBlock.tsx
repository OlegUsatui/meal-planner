import { Minus, Plus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { formatQuantity } from '../../../shared/formatting/format'
import { parseQuantity } from '../../products/domain/product'
import type { Product } from '../../products/types'
import { scaleIngredientQuantity, validateRecipeInput } from '../domain/recipe'
import { InlineEditButton, InlineEditorActions } from './InlineEditorActions'
import { RecipeIngredientRow, type RecipeIngredientDraft } from './RecipeIngredientRow'
import { recipeErrorMessage, type RecipeBlockPatch } from './recipe-editing'
import type { Recipe } from '../types'
import { SectionHeading } from '../../../shared/ui/SectionHeading'
import { Alert } from '../../../shared/ui/Alert'
import { Button } from '../../../shared/ui/Button'

type Row = RecipeIngredientDraft
type Props = { recipe: Recipe; products: Product[]; productsLoading: boolean; canManage: boolean; editing: boolean; blocked: boolean; onEdit: () => void; onCancel: () => void; onSave: (patch: RecipeBlockPatch) => Promise<void>; servings: number; onAdjustServings: (delta: number) => void }

export function RecipeIngredientsBlock({ recipe, products, productsLoading, canManage, editing, blocked, onEdit, onCancel, onSave, servings, onAdjustServings }: Props) {
  const [rows, setRows] = useState<Row[]>(rowsForRecipe(recipe))
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  useEffect(() => { if (editing) setRows(rowsForRecipe(recipe)) }, [editing, recipe.updatedAt])
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setMessage('')
    const ingredients = rows.map((row) => { try { return { productId: row.productId, enteredQuantity: parseQuantity(row.quantity), enteredUnit: row.unit } } catch { return { productId: row.productId, enteredQuantity: Number.NaN, enteredUnit: row.unit } } })
    const validation = validateRecipeInput({ ...recipeInputForValidation(recipe), ingredients })
    if (validation.ingredients) { setMessage(validation.ingredients); return }
    setPending(true); try { await onSave({ ingredients }) } catch (error: unknown) { setMessage(recipeErrorMessage(error)) } finally { setPending(false) }
  }
  const updateRow = (index: number, update: Partial<Row>) => setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...update } : row))
  return <section className="recipe-detail-panel recipe-ingredients-panel" aria-labelledby="ingredients-title"><SectionHeading eyebrow="Підготовка продуктів" title="Інгредієнти" titleId="ingredients-title" actions={<><span className="recipe-detail-panel-note">{recipe.ingredients.length} {recipe.ingredients.length === 1 ? 'продукт' : 'продуктів'}</span>{canManage && !editing && <InlineEditButton label="Редагувати інгредієнти" disabled={blocked} onClick={onEdit} />}</>} /><div className="recipe-servings-control"><span id="servings-label">Кількість порцій</span><div className="servings-stepper" role="group" aria-labelledby="servings-label"><button type="button" aria-label="Зменшити кількість порцій" disabled={servings <= 1} onClick={() => onAdjustServings(-1)}><Minus aria-hidden="true" /></button><input aria-label="Порцій" inputMode="numeric" min="1" max="99" value={servings} onChange={(event) => { const next = Number(event.target.value); if (Number.isInteger(next) && next >= 1 && next <= 99) onAdjustServings(next - servings) }} /><button type="button" aria-label="Збільшити кількість порцій" disabled={servings >= 99} onClick={() => onAdjustServings(1)}><Plus aria-hidden="true" /></button></div></div>{editing ? <form className="inline-editor-card" onSubmit={(event) => void submit(event)} noValidate>{productsLoading ? <p role="status">Завантажуємо продукти…</p> : <fieldset className="ingredient-fieldset"><legend className="sr-only">Інгредієнти рецепту</legend>{rows.map((row, index) => <RecipeIngredientRow key={row.key} row={row} index={index} products={products} rowCount={rows.length} onChange={updateRow} onRemove={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))} />)}<Button type="button" variant="secondary" onClick={() => setRows((current) => [...current, newRow()])}><Plus aria-hidden="true" /> Додати продукт</Button></fieldset>}{message && <Alert variant="error">{message}</Alert>}<InlineEditorActions saveLabel="Зберегти інгредієнти" pending={pending} onCancel={onCancel} /></form> : <ul className="ingredient-list">{recipe.ingredients.length ? recipe.ingredients.map((item) => <li key={item.id}><span>{item.productName}</span><strong>{formatQuantity(scaleIngredientQuantity(item.quantityBase, servings), item.productBaseUnit)}</strong></li>) : <li className="ingredient-list-empty">Інгредієнти ще не додані.</li>}</ul>}</section>
}

function newRow(): Row { return { key: crypto.randomUUID(), productId: '', quantity: '', unit: 'g' } }
function rowsForRecipe(recipe: Recipe): Row[] { return recipe.ingredients.length ? recipe.ingredients.map((item) => ({ key: item.id, productId: item.productId, quantity: String(item.enteredQuantity).replace('.', ','), unit: item.enteredUnit })) : [newRow()] }
function recipeInputForValidation(recipe: Recipe) { return { name: recipe.name, instructions: recipe.instructions, ingredients: recipe.ingredients.map(({ productId, enteredQuantity, enteredUnit }) => ({ productId, enteredQuantity, enteredUnit })), classifications: recipe.classifications, caloriesPerServing: recipe.caloriesPerServing, proteinGramsPerServing: recipe.proteinGramsPerServing, fatGramsPerServing: recipe.fatGramsPerServing, carbsGramsPerServing: recipe.carbsGramsPerServing, preparationTimeMinMinutes: recipe.preparationTimeMinMinutes, preparationTimeMaxMinutes: recipe.preparationTimeMaxMinutes } }
