import type { MealSlot } from '../meal-planner/domain/meal-plan.js'

export interface DashboardMeal {
  id: string
  date: string
  slot: MealSlot
  recipeId: string
  recipeName: string
  servings: number
}

export interface DashboardSummary {
  today: string
  todayEntries: DashboardMeal[]
  nextEntry: DashboardMeal | null
  sevenDayShoppingCount: number
  hasPersonalRecipes: boolean
  hasPersonalProducts: boolean
  hasPlanEntries: boolean
}

export interface DashboardRepository {
  get(today: string, signal?: AbortSignal): Promise<DashboardSummary>
}
