import { isPastMealPlanDate, type MealPlanInput, type MealSlot } from './meal-plan'
import type { MealPlanEntry } from '../types'

export interface MealPlanMoveResult {
  source: MealPlanInput
  target?: MealPlanInput
}

export function moveMealPlanEntries(source: MealPlanEntry, target: MealPlanEntry | undefined, targetDate: string, targetSlot: MealSlot, today: string): MealPlanMoveResult | undefined {
  if (isPastMealPlanDate(source.date, today) || isPastMealPlanDate(targetDate, today)) return undefined
  if (source.date === targetDate && source.slot === targetSlot) return undefined
  return {
    source: { date: targetDate, slot: targetSlot, recipeId: source.recipeId },
    target: target ? { date: source.date, slot: source.slot, recipeId: target.recipeId } : undefined,
  }
}
