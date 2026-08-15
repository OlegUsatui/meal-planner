import { QueryClient } from '@tanstack/react-query'

import { ApiClientError } from '../../api/api-client'

export const cacheTimes = {
  dynamicStale: 30_000,
  catalogueStale: 5 * 60_000,
  sessionGc: 30 * 60_000,
} as const

type QueryFilters = Record<string, unknown>

function canonicalFilters(filters: QueryFilters): QueryFilters {
  return Object.fromEntries(
    Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== '')
      .sort(([left], [right]) => left.localeCompare(right)),
  )
}

export const queryKeys = {
  me: (userId: string) => ['me', userId] as const,
  recipes: (userId: string, filters: QueryFilters = {}) =>
    ['recipes', userId, canonicalFilters(filters)] as const,
  recipe: (userId: string, recipeId: string) => ['recipe', userId, recipeId] as const,
  products: (userId: string, filters: QueryFilters = {}) =>
    ['products', userId, canonicalFilters(filters)] as const,
  mealPlan: (userId: string, from: string, to: string) =>
    ['meal-plan', userId, from, to] as const,
  dashboard: (userId: string, today: string) => ['dashboard', userId, today] as const,
  shoppingList: (userId: string, from: string, to?: string) =>
    ['shopping-list', userId, from, to ?? 'all'] as const,
}

function shouldRetry(failureCount: number, error: Error): boolean {
  if (failureCount >= 1) return false
  if (error instanceof ApiClientError) return error.status >= 500
  return error instanceof TypeError
}

export function createSessionQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: cacheTimes.sessionGc,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  })
}
