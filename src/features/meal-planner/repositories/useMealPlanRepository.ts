import { use } from 'react'
import type { MealPlanRepository } from '../types'
import { MealPlanRepositoryContext } from './meal-plan-repository-context'

export function useMealPlanRepository(): MealPlanRepository {
  const repository = use(MealPlanRepositoryContext)
  if (!repository) throw new Error('MealPlanRepositoryProvider is missing')
  return repository
}
