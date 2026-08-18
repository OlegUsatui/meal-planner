import { useEffect, useState, type FormEvent } from 'react'
import { validateRecipeInput } from '../domain/recipe'
import { InlineEditButton, InlineEditorActions } from './InlineEditorActions'
import { recipeErrorMessage, type RecipeBlockPatch } from './recipe-editing'
import type { Recipe } from '../types'
import { FormField } from '../../../shared/ui/FormField'
import { Alert } from '../../../shared/ui/Alert'

type Props = { recipe: Recipe; canManage: boolean; editing: boolean; blocked: boolean; onEdit: () => void; onCancel: () => void; onSave: (patch: RecipeBlockPatch) => Promise<void> }

export function RecipeInstructionsBlock({ recipe, canManage, editing, blocked, onEdit, onCancel, onSave }: Props) {
  const [instructions, setInstructions] = useState(recipe.instructions)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  useEffect(() => { if (editing) setInstructions(recipe.instructions) }, [editing, recipe.instructions, recipe.updatedAt])
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setMessage('')
    const validation = validateRecipeInput({ ...recipeInputForValidation(recipe), instructions })
    if (validation.instructions) { setMessage(validation.instructions); return }
    setPending(true); try { await onSave({ instructions }) } catch (error: unknown) { setMessage(recipeErrorMessage(error)) } finally { setPending(false) }
  }
  return <section className="recipe-detail-panel recipe-instructions-panel" aria-labelledby="instructions-title"><div className="poster-section-heading"><h2 id="instructions-title">Спосіб приготування:</h2>{canManage && !editing && <InlineEditButton label="Редагувати спосіб приготування" disabled={blocked} onClick={onEdit} />}</div>{editing ? <form className="inline-editor-card" onSubmit={(event) => void submit(event)} noValidate><FormField label="Спосіб приготування" control={<textarea rows={10} value={instructions} onChange={(event) => setInstructions(event.target.value)} />} />{message && <Alert variant="error">{message}</Alert>}<InlineEditorActions saveLabel="Зберегти спосіб приготування" pending={pending} onCancel={onCancel} /></form> : <p className="recipe-instructions">{recipe.instructions}</p>}</section>
}

function recipeInputForValidation(recipe: Recipe) { return { name: recipe.name, instructions: recipe.instructions, ingredients: recipe.ingredients.map(({ productId, enteredQuantity, enteredUnit }) => ({ productId, enteredQuantity, enteredUnit })), classifications: recipe.classifications, caloriesPerServing: recipe.caloriesPerServing, proteinGramsPerServing: recipe.proteinGramsPerServing, fatGramsPerServing: recipe.fatGramsPerServing, carbsGramsPerServing: recipe.carbsGramsPerServing, preparationTimeMinMinutes: recipe.preparationTimeMinMinutes, preparationTimeMaxMinutes: recipe.preparationTimeMaxMinutes } }
