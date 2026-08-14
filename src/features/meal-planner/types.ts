import type { MealSlot, MealPlanInput } from './domain/meal-plan'

export type MealPlanId = string

export interface MealPlanEntry extends MealPlanInput {
  id: MealPlanId
  createdAt: string
  updatedAt: string
}

export interface MealPlanRepository {
  list(from?: string): Promise<MealPlanEntry[]>
  getByDateSlot(date: string, slot: MealSlot): Promise<MealPlanEntry | undefined>
  upsert(input: MealPlanInput): Promise<MealPlanEntry>
  remove(id: MealPlanId): Promise<void>
}

export class MealPlanRepositoryError extends Error {
  readonly code: 'invalid-plan' | 'duplicate-slot' | 'not-found' | 'past-date'

  constructor(code: MealPlanRepositoryError['code'], message: string) {
    super(message)
    this.name = 'MealPlanRepositoryError'
    this.code = code
  }
}
