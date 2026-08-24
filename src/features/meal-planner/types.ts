import type { MealSlot, MealPlanInput } from './domain/meal-plan.js'

export type MealPlanId = string

export interface MealPlanEntry extends MealPlanInput {
  id: MealPlanId
  createdAt: string
  updatedAt: string
}

export interface MealPlanRange {
  from?: string
  to?: string
}

export interface MealPlanRepository {
  list(range?: MealPlanRange, signal?: AbortSignal): Promise<MealPlanEntry[]>
  getByDateSlot(date: string, slot: MealSlot): Promise<MealPlanEntry | undefined>
  upsert(input: MealPlanInput): Promise<MealPlanEntry>
  move(entryId: MealPlanId, targetDate: string, targetSlot: MealSlot): Promise<void>
  remove(id: MealPlanId): Promise<void>
}

export class MealPlanRepositoryError extends Error {
  readonly code: 'invalid-plan' | 'duplicate-slot' | 'move-failed' | 'not-found' | 'past-date'

  constructor(code: MealPlanRepositoryError['code'], message: string) {
    super(message)
    this.name = 'MealPlanRepositoryError'
    this.code = code
  }
}
