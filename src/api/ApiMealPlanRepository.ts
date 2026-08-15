import type { MealPlanInput } from '../features/meal-planner/domain/meal-plan'
import type { MealPlanEntry, MealPlanRange, MealPlanRepository } from '../features/meal-planner/types'
import { ApiClient } from './api-client'

export class ApiMealPlanRepository implements MealPlanRepository {
  private readonly client: ApiClient

  constructor(client: ApiClient) { this.client = client }

  list(range: MealPlanRange = {}, signal?: AbortSignal): Promise<MealPlanEntry[]> {
    const query = new URLSearchParams()
    if (range.from) query.set('from', range.from)
    if (range.to) query.set('to', range.to)
    const suffix = query.toString()
    const path = suffix ? `/api/meal-plan?${suffix}` : '/api/meal-plan'
    return signal ? this.client.get<MealPlanEntry[]>(path, { signal }) : this.client.get<MealPlanEntry[]>(path)
  }

  async getByDateSlot(date: string, slot: MealPlanInput['slot']): Promise<MealPlanEntry | undefined> {
    const entries = await this.list({ from: date, to: date })
    return entries.find((entry) => entry.date === date && entry.slot === slot)
  }

  upsert(input: MealPlanInput): Promise<MealPlanEntry> { return this.client.put<MealPlanEntry>('/api/meal-plan', input) }

  async remove(id: string): Promise<void> { await this.client.delete(`/api/meal-plan/${encodeURIComponent(id)}`) }
}
