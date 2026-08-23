import type { Recipe } from '../../recipes/types'

type NutritionRecipe = Pick<Recipe, 'caloriesPerServing' | 'proteinGramsPerServing' | 'fatGramsPerServing' | 'carbsGramsPerServing'>

export interface DailyNutritionInput { recipe?: NutritionRecipe }
export interface DailyNutritionSummary { mealCount: number; calories: number | null; proteinGrams: number | null; fatGrams: number | null; carbsGrams: number | null }

export function calculateDailyNutrition(entries: DailyNutritionInput[]): DailyNutritionSummary {
  if (entries.length === 0) return { mealCount: 0, calories: null, proteinGrams: null, fatGrams: null, carbsGrams: null }
  return {
    mealCount: entries.length,
    calories: sumMetric(entries, (recipe) => recipe.caloriesPerServing, Math.round),
    proteinGrams: sumMetric(entries, (recipe) => recipe.proteinGramsPerServing, roundToTenth),
    fatGrams: sumMetric(entries, (recipe) => recipe.fatGramsPerServing, roundToTenth),
    carbsGrams: sumMetric(entries, (recipe) => recipe.carbsGramsPerServing, roundToTenth),
  }
}

function sumMetric(entries: DailyNutritionInput[], getValue: (recipe: NutritionRecipe) => number | null, round: (value: number) => number): number | null {
  if (entries.some((entry) => entry.recipe === undefined || getValue(entry.recipe) === null)) return null
  return round(entries.reduce((total, entry) => total + getValue(entry.recipe!)!, 0))
}

function roundToTenth(value: number): number { return Math.round(value * 10) / 10 }
