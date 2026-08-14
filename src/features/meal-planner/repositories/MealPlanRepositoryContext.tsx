import { type ReactNode } from 'react'
import type { MealPlanRepository } from '../types'
import { MealPlanRepositoryContext } from './meal-plan-repository-context'

export function MealPlanRepositoryProvider({ repository, children }: { repository: MealPlanRepository; children: ReactNode }) {
  return <MealPlanRepositoryContext value={repository}>{children}</MealPlanRepositoryContext>
}
