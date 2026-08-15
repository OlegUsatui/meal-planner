import { describe, expect, it, vi } from 'vitest'
import { ApiMealPlanRepository } from './ApiMealPlanRepository'
import { ApiProductRepository } from './ApiProductRepository'
import { ApiRecipeRepository } from './ApiRecipeRepository'
import { ApiShoppingListRepository } from './ApiShoppingListRepository'
import type { ApiClient } from './api-client'
import type { RecipePage } from '../features/recipes/repositories/recipe-repository'
import type { ProductPage } from '../features/products/repositories/product-repository'

function fakeClient() {
  return { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn(), uploadRecipeImage: vi.fn() } as unknown as ApiClient
}

describe('API repository contracts', () => {
  it('encodes recipe and product list queries', async () => {
    const client = fakeClient()
    vi.mocked(client.get).mockResolvedValueOnce([]).mockResolvedValueOnce([])
    await new ApiRecipeRepository(client).list('суп з рисом')
    await new ApiProductRepository(client).list({ query: 'молоко', includeArchived: true })
    expect(client.get).toHaveBeenNthCalledWith(1, '/api/recipes?query=%D1%81%D1%83%D0%BF%20%D0%B7%20%D1%80%D0%B8%D1%81%D0%BE%D0%BC')
    expect(client.get).toHaveBeenNthCalledWith(2, '/api/products?query=%D0%BC%D0%BE%D0%BB%D0%BE%D0%BA%D0%BE&includeArchived=true')
  })

  it('requests a server-paginated recipe page with server-side filters', async () => {
    const client = fakeClient()
    const page = { items: [], page: 2, pageSize: 24, total: 50, hasNext: true } satisfies RecipePage
    vi.mocked(client.get).mockResolvedValue(page)

    await new ApiRecipeRepository(client).listPage('суп з рисом', { page: 2, pageSize: 24, mealType: 'lunch', subcategoryId: 'lunch-soups' })

    expect(client.get).toHaveBeenCalledWith('/api/recipes?query=%D1%81%D1%83%D0%BF%20%D0%B7%20%D1%80%D0%B8%D1%81%D0%BE%D0%BC&page=2&pageSize=24&mealType=lunch&subcategoryId=lunch-soups')
  })

  it('requests a server-paginated product page with search and archive filters', async () => {
    const client = fakeClient()
    const page = { items: [], page: 2, pageSize: 24, total: 50, hasNext: true } satisfies ProductPage
    vi.mocked(client.get).mockResolvedValue(page)

    await new ApiProductRepository(client).listPage({ page: 2, pageSize: 24, query: 'молоко', includeArchived: true })

    expect(client.get).toHaveBeenCalledWith('/api/products?page=2&pageSize=24&query=%D0%BC%D0%BE%D0%BB%D0%BE%D0%BA%D0%BE&includeArchived=true')
  })

  it('uses REST verbs for meal plan and shopping list operations', async () => {
    const client = fakeClient()
    vi.mocked(client.get).mockResolvedValue([])
    vi.mocked(client.put).mockResolvedValue({})
    vi.mocked(client.delete).mockResolvedValue(null)
    const mealPlan = new ApiMealPlanRepository(client)
    await mealPlan.list('2026-08-14')
    await mealPlan.upsert({ date: '2026-08-15', slot: 'dinner', recipeId: 'recipe-1', servings: 2 })
    await mealPlan.remove('entry-1')
    await new ApiShoppingListRepository(client).list('2026-08-14')
    expect(client.get).toHaveBeenCalledWith('/api/meal-plan?from=2026-08-14')
    expect(client.put).toHaveBeenCalledWith('/api/meal-plan', { date: '2026-08-15', slot: 'dinner', recipeId: 'recipe-1', servings: 2 })
    expect(client.delete).toHaveBeenCalledWith('/api/meal-plan/entry-1')
    expect(client.get).toHaveBeenCalledWith('/api/shopping-list?today=2026-08-14')
  })

  it('uploads before creating a recipe and sends only JSON metadata to the API', async () => {
    const client = fakeClient()
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001')
    vi.mocked(client.uploadRecipeImage).mockResolvedValue({ path: 'user-1/00000000-0000-4000-8000-000000000001.webp', signedUrl: 'signed' })
    vi.mocked(client.post).mockResolvedValue({ id: '00000000-0000-4000-8000-000000000001' })
    await new ApiRecipeRepository(client).create({ name: 'Суп', instructions: 'Зварити', ingredients: [], classifications: [], caloriesPerServing: null, proteinGramsPerServing: null, fatGramsPerServing: null, carbsGramsPerServing: null, preparationTimeMinMinutes: null, preparationTimeMaxMinutes: null, image: { blob: new Blob(['x'], { type: 'image/webp' }), mimeType: 'image/webp', width: 10, height: 10, byteSize: 1 } })
    expect(client.uploadRecipeImage).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000001', expect.objectContaining({ mimeType: 'image/webp' }), 'create')
    expect(client.post).toHaveBeenCalledWith('/api/recipes', expect.objectContaining({ id: '00000000-0000-4000-8000-000000000001', image: expect.objectContaining({ path: 'user-1/00000000-0000-4000-8000-000000000001.webp' }) }))
  })
})
