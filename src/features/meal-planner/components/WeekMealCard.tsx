import { Clock3 } from 'lucide-react'
import { formatPreparationTime } from '../../recipes/domain/recipe'
import { getRecipeSubcategory } from '../../recipes/domain/recipe-taxonomy'
import type { RecipeSummary } from '../../recipes/types'
import type { MealPlanEntry } from '../types'
import { RecipeImage } from './RecipeImage'
import { MealCardControls } from './MealCardControls'

export function WeekMealCard({ entry, recipe, readOnly, onOpen, onReplace, onRemove, onServingsChange }: { entry: MealPlanEntry; recipe: RecipeSummary; readOnly: boolean; onOpen: (trigger: HTMLElement) => void; onReplace: () => void; onRemove: () => void; onServingsChange: (servings: number) => Promise<void> | void }) {
  const preparationTime = formatPreparationTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes)
  const category = recipe.classifications.map((item) => getRecipeSubcategory(item.subcategoryId)?.label).find(Boolean)
  return <article className="meal-card">
    <button className="meal-card-main" type="button" onClick={(event) => onOpen(event.currentTarget)} aria-label={`Відкрити рецепт ${recipe.name}`}>
      <RecipeImage blob={recipe.image?.blob} url={recipe.image?.url} alt="" className="meal-card-image" />
      <span className="meal-card-copy">
        <strong>{recipe.name}</strong>
        {(preparationTime || category) && <span className="meal-card-meta">{preparationTime && <span><Clock3 aria-hidden="true" /> {preparationTime}</span>}{category && <span>{category}</span>}</span>}
      </span>
    </button>
    <MealCardControls recipeName={recipe.name} servings={entry.servings} readOnly={readOnly} variant="week" onServingsChange={onServingsChange} onReplace={onReplace} onRemove={onRemove} />
  </article>
}
