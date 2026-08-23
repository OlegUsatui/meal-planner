import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import { cacheTimes, queryKeys } from '../../app/query/query-client'
import { useOptionalAuth } from '../auth/useAuth'
import { useRecipeRepository } from '../recipes/repositories/useRecipeRepository'
import type { Recipe } from '../recipes/types'
import type { DashboardMeal } from './types'

export function useTodayRecipes(entries: DashboardMeal[]): { recipes: Map<string, Recipe>; loading: boolean } {
  const repository = useRecipeRepository()
  const userId = useOptionalAuth()?.session?.user.id ?? 'test-session'
  const recipeIds = useMemo(() => [...new Set(entries.map((entry) => entry.recipeId))], [entries])
  const queries = useQueries({ queries: recipeIds.map((recipeId) => ({ queryKey: queryKeys.recipe(userId, recipeId), queryFn: ({ signal }: { signal: AbortSignal }) => repository.get(recipeId, signal), staleTime: cacheTimes.catalogueStale, retry: false })) })
  const recipes = useMemo(() => new Map<string, Recipe>(queries.flatMap((query) => query.data ? [[query.data.id, query.data] as const] : [])), [queries])
  return { recipes, loading: queries.some((query) => query.isPending) }
}
