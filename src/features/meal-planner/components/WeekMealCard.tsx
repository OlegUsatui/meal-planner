import type { RecipeSummary } from '../../recipes/types'
import type { MealPlanEntry } from '../types'
import { RecipeImage } from './RecipeImage'
import { MealCardControls } from './MealCardControls'

export function WeekMealCard({ entry, recipe, readOnly, onOpen, onReplace, onRemove, onServingsChange }: { entry: MealPlanEntry; recipe: RecipeSummary; readOnly: boolean; onOpen: (trigger: HTMLElement) => void; onReplace: () => void; onRemove: () => void; onServingsChange: (servings: number) => Promise<void> | void }) {
  return <article className="meal-card">
    <button className="meal-card-main" type="button" title={recipe.name} data-tooltip={recipe.name} onClick={(event) => onOpen(event.currentTarget)} aria-label={`Відкрити рецепт ${recipe.name}`}>
      <RecipeImage blob={recipe.image?.blob} url={recipe.image?.url} alt="" className="meal-card-image" />
    </button>
    <MealCardControls recipeName={recipe.name} servings={entry.servings} readOnly={readOnly} variant="week" onServingsChange={onServingsChange} onReplace={onReplace} onRemove={onRemove} />
  </article>
}
