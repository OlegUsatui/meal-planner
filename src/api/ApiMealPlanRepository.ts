import type { MealPlanInput } from '../features/meal-planner/domain/meal-plan'
import type { MealPlanEntry, MealPlanRepository } from '../features/meal-planner/types'
import { ApiClient } from './api-client'

export class ApiMealPlanRepository implements MealPlanRepository {
  private readonly client: ApiClient

  constructor(client: ApiClient) { this.client = client }

  list(from?: string): Promise<MealPlanEntry[]> { return this.client.get<MealPlanEntry[]>(from ? `/api/meal-plan?from=${encodeURIComponent(from)}` : '/api/meal-plan') }

  async getByDateSlot(date: string, slot: MealPlanInput['slot']): Promise<MealPlanEntry | undefined> {
    const entries = await this.list(date)
    return entries.find((entry) => entry.date === date && entry.slot === slot)
  }

  upsert(input: MealPlanInput): Promise<MealPlanEntry> { return this.client.put<MealPlanEntry>('/api/meal-plan', input) }

  async remove(id: string): Promise<void> { await this.client.delete(`/api/meal-plan/${encodeURIComponent(id)}`) }
}
