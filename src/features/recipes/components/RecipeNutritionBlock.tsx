import { useEffect, useState, type FormEvent } from 'react'
import { validateRecipeInput } from '../domain/recipe'
import { InlineEditButton, InlineEditorActions } from './InlineEditorActions'
import { optionalNumber, recipeErrorMessage, type RecipeBlockPatch } from './recipe-editing'
import type { Recipe } from '../types'

type Props = { recipe: Recipe; canManage: boolean; editing: boolean; blocked: boolean; onEdit: () => void; onCancel: () => void; onSave: (patch: RecipeBlockPatch) => Promise<void> }
const fields = [{ key: 'caloriesPerServing', label: 'Калорії, ккал' }, { key: 'proteinGramsPerServing', label: 'Білки, г' }, { key: 'fatGramsPerServing', label: 'Жири, г' }, { key: 'carbsGramsPerServing', label: 'Вуглеводи, г' }] as const

export function RecipeNutritionBlock({ recipe, canManage, editing, blocked, onEdit, onCancel, onSave }: Props) {
  const [values, setValues] = useState<Record<typeof fields[number]['key'], string>>({ caloriesPerServing: String(recipe.caloriesPerServing ?? ''), proteinGramsPerServing: String(recipe.proteinGramsPerServing ?? ''), fatGramsPerServing: String(recipe.fatGramsPerServing ?? ''), carbsGramsPerServing: String(recipe.carbsGramsPerServing ?? '') })
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  useEffect(() => { if (editing) setValues({ caloriesPerServing: String(recipe.caloriesPerServing ?? ''), proteinGramsPerServing: String(recipe.proteinGramsPerServing ?? ''), fatGramsPerServing: String(recipe.fatGramsPerServing ?? ''), carbsGramsPerServing: String(recipe.carbsGramsPerServing ?? '') }) }, [editing, recipe.updatedAt])
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setMessage('')
    const patch: RecipeBlockPatch = { caloriesPerServing: optionalNumber(values.caloriesPerServing), proteinGramsPerServing: optionalNumber(values.proteinGramsPerServing), fatGramsPerServing: optionalNumber(values.fatGramsPerServing), carbsGramsPerServing: optionalNumber(values.carbsGramsPerServing) }
    const validation = validateRecipeInput({ ...recipeInputForValidation(recipe), ...patch })
    if (validation.nutrition) { setMessage(validation.nutrition); return }
    setPending(true); try { await onSave(patch) } catch (error: unknown) { setMessage(recipeErrorMessage(error)) } finally { setPending(false) }
  }
  return <section className="recipe-detail-panel recipe-nutrition-panel" aria-labelledby="nutrition-title"><div className="section-heading"><div><p className="eyebrow">Харчова цінність</p><h2 id="nutrition-title">На одну порцію</h2></div><div className="section-heading-actions"><span className="recipe-detail-panel-note">Орієнтовно</span>{canManage && !editing && <InlineEditButton label="Редагувати харчову цінність" disabled={blocked} onClick={onEdit} />}</div></div>{editing ? <form className="inline-editor-card" onSubmit={(event) => void submit(event)} noValidate><div className="form-grid">{fields.map((field) => <label className="field" key={field.key}>{field.label}<input inputMode="decimal" value={values[field.key]} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} /></label>)}</div>{message && <div className="form-alert" role="alert">{message}</div>}<InlineEditorActions saveLabel="Зберегти харчову цінність" pending={pending} onCancel={onCancel} /></form> : <div className="nutrition-cards">{fields.map((field) => <div className="nutrition-card" key={field.key}><span>{field.label.replace(', ккал', '').replace(', г', '')}</span><strong>{formatNutrition(recipe[field.key], field.key === 'caloriesPerServing' ? 'ккал' : 'г')}</strong></div>)}</div>}</section>
}

function formatNutrition(value: number | null, unit: string): string { return value == null ? '—' : `${value} ${unit}` }
function recipeInputForValidation(recipe: Recipe) { return { name: recipe.name, instructions: recipe.instructions, ingredients: recipe.ingredients.map(({ productId, enteredQuantity, enteredUnit }) => ({ productId, enteredQuantity, enteredUnit })), classifications: recipe.classifications, caloriesPerServing: recipe.caloriesPerServing, proteinGramsPerServing: recipe.proteinGramsPerServing, fatGramsPerServing: recipe.fatGramsPerServing, carbsGramsPerServing: recipe.carbsGramsPerServing, preparationTimeMinMinutes: recipe.preparationTimeMinMinutes, preparationTimeMaxMinutes: recipe.preparationTimeMaxMinutes } }
