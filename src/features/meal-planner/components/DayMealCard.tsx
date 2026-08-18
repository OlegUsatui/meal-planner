import { Clock3 } from 'lucide-react'
import { formatPreparationTime } from '../../recipes/domain/recipe'
import { getRecipeSubcategory } from '../../recipes/domain/recipe-taxonomy'
import type { RecipeSummary } from '../../recipes/types'
import type { MealPlanEntry } from '../types'
import { RecipeImage } from './RecipeImage'
import { MealCardControls } from './MealCardControls'

type DayRecipe = RecipeSummary & {
  caloriesPerServing?: number | null
  proteinGramsPerServing?: number | null
  fatGramsPerServing?: number | null
  carbsGramsPerServing?: number | null
}

export function DayMealCard({ entry, recipe, readOnly, onOpen, onReplace, onRemove, onServingsChange }: { entry: MealPlanEntry; recipe: DayRecipe; readOnly: boolean; onOpen: (trigger: HTMLElement) => void; onReplace: () => void; onRemove: () => void; onServingsChange: (servings: number) => Promise<void> | void }) {
  const preparationTime = formatPreparationTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes)
  const categories = recipe.classifications.map((item) => getRecipeSubcategory(item.subcategoryId)?.label).filter((label): label is string => Boolean(label))
  const nutrition = [
    recipe.caloriesPerServing === null || recipe.caloriesPerServing === undefined ? null : `${recipe.caloriesPerServing} ккал`,
    recipe.proteinGramsPerServing === null || recipe.proteinGramsPerServing === undefined ? null : `Б ${recipe.proteinGramsPerServing} г`,
    recipe.fatGramsPerServing === null || recipe.fatGramsPerServing === undefined ? null : `Ж ${recipe.fatGramsPerServing} г`,
    recipe.carbsGramsPerServing === null || recipe.carbsGramsPerServing === undefined ? null : `В ${recipe.carbsGramsPerServing} г`,
  ].filter((value): value is string => Boolean(value))
  return <article className="day-meal-card">
    <button className="day-meal-card-main" type="button" onClick={(event) => onOpen(event.currentTarget)} aria-label={`Відкрити рецепт ${recipe.name}`}>
      <RecipeImage blob={recipe.image?.blob} url={recipe.image?.url} alt="" className="day-meal-card-image" />
      <span className="day-meal-card-content"><strong>{recipe.name}</strong><span className="day-meal-card-meta">{preparationTime && <span><Clock3 aria-hidden="true" /> {preparationTime}</span>}<span>{categories.length ? categories.join(' · ') : 'Без категорії'}</span></span>{nutrition.length > 0 && <span className="day-meal-card-nutrition" aria-label="Харчова цінність">{nutrition.map((value) => <span key={value}>{value}</span>)}</span>}</span>
    </button>
    <MealCardControls recipeName={recipe.name} servings={entry.servings} readOnly={readOnly} variant="day" onServingsChange={onServingsChange} onReplace={onReplace} onRemove={onRemove} />
  </article>
}
