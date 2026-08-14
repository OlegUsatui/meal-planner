import { createContext } from 'react'
import type { MealPlanRepository } from '../types'

export const MealPlanRepositoryContext = createContext<MealPlanRepository | null>(null)
