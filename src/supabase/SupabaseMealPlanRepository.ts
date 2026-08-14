import type { SupabaseClient } from '@supabase/supabase-js'
import { isPastMealPlanDate, validateMealPlanInput, type MealPlanInput, type MealSlot } from '../features/meal-planner/domain/meal-plan.js'
import { MealPlanRepositoryError, type MealPlanEntry, type MealPlanRepository } from '../features/meal-planner/types.js'
import { currentUserId } from './common.js'

interface PlanRow { id: string; date: string; slot: MealSlot; date_slot: string; recipe_id: string; servings: number; created_at: string; updated_at: string }

export class SupabaseMealPlanRepository implements MealPlanRepository {
  private readonly client: SupabaseClient
  private readonly today: () => string

  constructor(client: SupabaseClient, today: () => string = () => new Intl.DateTimeFormat('sv-SE').format(new Date())) { this.client = client; this.today = today }

  async list(from?: string): Promise<MealPlanEntry[]> {
    const ownerId = await currentUserId(this.client)
    let query = this.client.from('meal_plan_entries').select('*').eq('owner_id', ownerId).order('date')
    if (from) query = query.gte('date', from)
    const { data, error } = await query
    if (error) throw new MealPlanRepositoryError('not-found', `Не вдалося завантажити план. ${error.message}`)
    return (data as unknown as PlanRow[]).map(toEntry)
  }

  async getByDateSlot(date: string, slot: MealSlot): Promise<MealPlanEntry | undefined> {
    const ownerId = await currentUserId(this.client)
    const { data, error } = await this.client.from('meal_plan_entries').select('*').eq('owner_id', ownerId).eq('date_slot', `${date}:${slot}`).maybeSingle()
    if (error) throw new MealPlanRepositoryError('not-found', error.message)
    return data ? toEntry(data as unknown as PlanRow) : undefined
  }

  async upsert(input: MealPlanInput): Promise<MealPlanEntry> {
    const errors = validateMealPlanInput(input)
    if (Object.keys(errors).length) throw new MealPlanRepositoryError('invalid-plan', 'Некоректний запис плану')
    if (isPastMealPlanDate(input.date, this.today())) throw new MealPlanRepositoryError('past-date', 'Не можна планувати страви на минулу дату')
    const ownerId = await currentUserId(this.client); const now = new Date().toISOString(); const id = crypto.randomUUID()
    const { data, error } = await this.client.from('meal_plan_entries').upsert({ id, owner_id: ownerId, date: input.date, slot: input.slot, date_slot: `${input.date}:${input.slot}`, recipe_id: input.recipeId, servings: input.servings, created_at: now, updated_at: now }, { onConflict: 'owner_id,date_slot' }).select().single()
    if (error || !data) throw new MealPlanRepositoryError('duplicate-slot', `Не вдалося зберегти план. ${error?.message ?? ''}`)
    return toEntry(data as unknown as PlanRow)
  }

  async remove(id: string): Promise<void> {
    const ownerId = await currentUserId(this.client)
    const { data, error } = await this.client.from('meal_plan_entries').select('date').eq('id', id).eq('owner_id', ownerId).maybeSingle()
    if (error || !data) throw new MealPlanRepositoryError('not-found', 'Запис плану не знайдено')
    if (isPastMealPlanDate(data.date as string, this.today())) throw new MealPlanRepositoryError('past-date', 'Не можна змінювати план на минулу дату')
    const { error: deleteError } = await this.client.from('meal_plan_entries').delete().eq('id', id).eq('owner_id', ownerId)
    if (deleteError) throw new MealPlanRepositoryError('not-found', deleteError.message)
  }
}

function toEntry(row: PlanRow): MealPlanEntry { return { id: row.id, date: row.date, slot: row.slot, recipeId: row.recipe_id, servings: row.servings, createdAt: row.created_at, updatedAt: row.updated_at } }
