import type { QueryClient } from '@tanstack/react-query'

export async function invalidateRecipeData(queryClient: QueryClient, userId: string, recipeId?: string): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['recipes', userId] }),
    ...(recipeId ? [queryClient.invalidateQueries({ queryKey: ['recipe', userId, recipeId] })] : []),
    queryClient.invalidateQueries({ queryKey: ['dashboard', userId] }),
    queryClient.invalidateQueries({ queryKey: ['shopping-list', userId] }),
  ])
}

export async function invalidateProductData(queryClient: QueryClient, userId: string): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['products', userId] }),
    queryClient.invalidateQueries({ queryKey: ['recipes', userId] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard', userId] }),
  ])
}

export async function invalidateMealPlanData(queryClient: QueryClient, userId: string): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['meal-plan', userId] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard', userId] }),
    queryClient.invalidateQueries({ queryKey: ['shopping-list', userId] }),
  ])
}
