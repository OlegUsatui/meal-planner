import { useRef, type MouseEvent } from 'react'
import { formatQuantity } from '../../../shared/formatting/format'
import { formatPreparationTime, scaleIngredientQuantity } from '../../recipes/domain/recipe'
import type { Recipe } from '../../recipes/types'
import { scaleNutrition } from '../domain/meal-plan'
import type { MealPlanEntry } from '../types'
import { RecipeImage } from './RecipeImage'
import { useDialogFocus } from './useDialogFocus'
import { getRecipeSubcategory, recipeMealTypes } from '../../recipes/domain/recipe-taxonomy'

export function RecipeDetailsDialog({ recipe, entry, returnFocus, onClose }: { recipe: Recipe; entry: MealPlanEntry; returnFocus?: HTMLElement | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useDialogFocus(dialogRef, onClose, returnFocus)
  const backdrop = (event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose() }
  return <div className="planner-dialog-backdrop" onMouseDown={backdrop}><div className="planner-dialog recipe-dialog" role="dialog" aria-modal="true" aria-labelledby="recipe-dialog-title" ref={dialogRef}>
    <button type="button" className="dialog-close" aria-label="Закрити" onClick={onClose}>×</button>
    <div className="recipe-dialog-layout"><RecipeImage blob={recipe.image.blob} url={recipe.image.url} alt={`Фото страви ${recipe.name}`} className="recipe-dialog-image" /><div className="recipe-dialog-content"><p className="eyebrow">{formatPreparationTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes) ? `${formatPreparationTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes)} приготування` : 'Час: —'}</p><h2 id="recipe-dialog-title">{recipe.name}</h2><div className="recipe-category-badges">{recipe.classifications.length ? recipe.classifications.map((item) => <span key={`${item.mealType}:${item.subcategoryId}`}>{recipeMealTypes.find((type) => type.value === item.mealType)?.label}: {getRecipeSubcategory(item.subcategoryId)?.label}</span>) : <span>Без категорії</span>}</div><p className="planned-servings">Заплановано: <strong>{entry.servings}</strong> порц.</p>
      <div className="nutrition-comparison"><Nutrition title="На 1 порцію" recipe={recipe} servings={1} /><Nutrition title={`Разом на ${entry.servings} порц.`} recipe={recipe} servings={entry.servings} /></div>
      <h3>Інгредієнти</h3><ul className="dialog-ingredient-list">{recipe.ingredients.map((ingredient) => <li key={ingredient.id}><span>{ingredient.productName}</span><strong>{formatQuantity(scaleIngredientQuantity(ingredient.quantityBase, entry.servings), ingredient.productBaseUnit)}</strong></li>)}</ul>
      <h3>Спосіб приготування</h3><p className="dialog-instructions">{recipe.instructions}</p>
    </div></div>
  </div></div>
}

function Nutrition({ title, recipe, servings }: { title: string; recipe: Recipe; servings: number }) {
  const value = (amount: number | null, unit: string) => { const scaled = scaleNutrition(amount, servings); return scaled === null ? '—' : `${scaled} ${unit}` }
  return <section className="nutrition-panel"><h3>{title}</h3><dl><div><dt>Калорії</dt><dd>{value(recipe.caloriesPerServing, 'ккал')}</dd></div><div><dt>Білки</dt><dd>{value(recipe.proteinGramsPerServing, 'г')}</dd></div><div><dt>Жири</dt><dd>{value(recipe.fatGramsPerServing, 'г')}</dd></div><div><dt>Вуглеводи</dt><dd>{value(recipe.carbsGramsPerServing, 'г')}</dd></div></dl></section>
}
