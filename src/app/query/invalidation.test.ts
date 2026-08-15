import { describe, expect, it, vi } from 'vitest'

import { createSessionQueryClient } from './query-client'
import { invalidateMealPlanData, invalidateProductData, invalidateRecipeData } from './invalidation'

describe('query invalidation mapping', () => {
  it('invalidates recipe detail, catalogues, dashboard and shopping', async () => {
    const client = createSessionQueryClient()
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await invalidateRecipeData(client, 'user-1', 'recipe-1')

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['recipes', 'user-1'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['recipe', 'user-1', 'recipe-1'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['dashboard', 'user-1'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['shopping-list', 'user-1'] })
  })

  it('invalidates every derived view after meal-plan and product writes', async () => {
    const client = createSessionQueryClient()
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await invalidateMealPlanData(client, 'user-1')
    await invalidateProductData(client, 'user-1')

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['meal-plan', 'user-1'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['shopping-list', 'user-1'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['products', 'user-1'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['recipes', 'user-1'] })
  })
})
