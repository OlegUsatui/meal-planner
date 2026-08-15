import type { SupabaseClient } from '@supabase/supabase-js'
import type { DashboardMeal, DashboardRepository, DashboardSummary } from '../features/dashboard/types.js'
import { mealSlots, shiftDate } from '../features/meal-planner/domain/meal-plan.js'
import { SupabaseMealPlanRepository } from './SupabaseMealPlanRepository.js'
import { SupabaseShoppingListRepository } from './SupabaseShoppingListRepository.js'
import { currentUserId } from './common.js'

interface RecipeRow { id: string; name: string; owner_id: string | null }

export class SupabaseDashboardRepository implements DashboardRepository {
  private readonly client: SupabaseClient
  constructor(client: SupabaseClient) { this.client = client }

  async get(today: string): Promise<DashboardSummary> {
    const ownerId = await currentUserId(this.client)
    const to = shiftDate(today, 6)
    const mealPlan = new SupabaseMealPlanRepository(this.client)
    const shopping = new SupabaseShoppingListRepository(this.client)
    const [entries, shoppingItems, recipeResult, productResult, planCountResult] = await Promise.all([
      mealPlan.list({ from: today, to }),
      shopping.list({ from: today, to }),
      this.client.from('recipes').select('id,name,owner_id').is('archived_at', null),
      this.client.from('products').select('id', { count: 'exact', head: true }).eq('owner_id', ownerId).is('archived_at', null),
      this.client.from('meal_plan_entries').select('id', { count: 'exact', head: true }).eq('owner_id', ownerId),
    ])
    if (recipeResult.error || productResult.error || planCountResult.error) throw new Error('Не вдалося завантажити огляд дня.')
    const recipes = recipeResult.data as unknown as RecipeRow[]
    const names = new Map(recipes.map((recipe) => [recipe.id, recipe.name]))
    const meals = entries.map((entry): DashboardMeal => ({ id: entry.id, date: entry.date, slot: entry.slot, recipeId: entry.recipeId, recipeName: names.get(entry.recipeId) ?? 'Рецепт недоступний', servings: entry.servings }))
    const slotOrder = new Map(mealSlots.map((slot, index) => [slot.value, index]))
    meals.sort((a, b) => a.date.localeCompare(b.date) || (slotOrder.get(a.slot) ?? 0) - (slotOrder.get(b.slot) ?? 0))
    return { today, todayEntries: meals.filter((entry) => entry.date === today), nextEntry: meals[0] ?? null, sevenDayShoppingCount: shoppingItems.length, hasPersonalRecipes: recipes.some((recipe) => recipe.owner_id === ownerId), hasPersonalProducts: (productResult.count ?? 0) > 0, hasPlanEntries: (planCountResult.count ?? 0) > 0 }
  }
}
