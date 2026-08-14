import { describe, expect, it, vi } from 'vitest'
import recipeCollection from './recipes/index.js'
import recipeItem from './recipes/[id].js'
import productCollection from './products/index.js'
import mealPlanCollection from './meal-plan/index.js'

const mocks = vi.hoisted(() => ({
  auth: vi.fn().mockResolvedValue({ client: {}, user: { id: 'user-1' } }),
  recipes: { list: vi.fn(), get: vi.fn(), createUploaded: vi.fn(), update: vi.fn(), updateUploaded: vi.fn(), archive: vi.fn() },
  products: { list: vi.fn(), create: vi.fn() },
  mealPlan: { list: vi.fn(), upsert: vi.fn() },
}))

vi.mock('./_lib/auth', () => ({ authenticate: mocks.auth }))
vi.mock('../src/supabase/SupabaseRecipeRepository', () => ({ SupabaseRecipeRepository: class { constructor() { return mocks.recipes as never } } }))
vi.mock('../src/supabase/SupabaseProductRepository', () => ({ SupabaseProductRepository: class { constructor() { return mocks.products as never } } }))
vi.mock('../src/supabase/SupabaseMealPlanRepository', () => ({ SupabaseMealPlanRepository: class { constructor() { return mocks.mealPlan as never } } }))

describe('REST handlers', () => {
  it('handles recipe collection GET and POST', async () => {
    mocks.recipes.list.mockResolvedValueOnce([{ id: 'recipe-1' }])
    mocks.recipes.createUploaded.mockResolvedValueOnce({ id: 'recipe-2' })
    const getResponse = response()
    await recipeCollection({ method: 'GET', url: '/api/recipes?query=soup', headers: {} }, getResponse)
    expect(getResponse.payload).toEqual({ data: [{ id: 'recipe-1' }] })
    expect(mocks.recipes.list).toHaveBeenCalledWith('soup')

    const postResponse = response()
    await recipeCollection({ method: 'POST', headers: {}, body: { id: 'recipe-2', image: { path: 'user-1/recipe-2.webp' } } }, postResponse)
    expect(postResponse.statusCode).toBe(201)
    expect(mocks.recipes.createUploaded).toHaveBeenCalled()
  })

  it('handles recipe item GET, PATCH, and DELETE', async () => {
    mocks.recipes.get.mockResolvedValue({ id: 'recipe-1' })
    mocks.recipes.update.mockResolvedValue({ id: 'recipe-1' })
    mocks.recipes.archive.mockResolvedValue(undefined)
    const getResponse = response()
    await recipeItem({ method: 'GET', url: '/api/recipes/recipe-1', headers: {} }, getResponse)
    expect(mocks.recipes.get).toHaveBeenCalledWith('recipe-1')
    const patchResponse = response()
    await recipeItem({ method: 'PATCH', url: '/api/recipes/recipe-1', headers: {}, body: { name: 'Soup' } }, patchResponse)
    expect(mocks.recipes.update).toHaveBeenCalledWith('recipe-1', { name: 'Soup' })
    await recipeItem({ method: 'DELETE', url: '/api/recipes/recipe-1', headers: {} }, response())
    expect(mocks.recipes.archive).toHaveBeenCalledWith('recipe-1')
  })

  it('handles product collection and meal-plan collection', async () => {
    mocks.products.list.mockResolvedValue([])
    mocks.products.create.mockResolvedValue({ id: 'product-1' })
    await productCollection({ method: 'GET', url: '/api/products?query=rice', headers: {} }, response())
    expect(mocks.products.list).toHaveBeenCalledWith({ query: 'rice', category: undefined, includeArchived: false })
    await productCollection({ method: 'POST', headers: {}, body: { name: 'Rice' } }, response())
    expect(mocks.products.create).toHaveBeenCalledWith({ name: 'Rice' })

    mocks.mealPlan.list.mockResolvedValue([])
    mocks.mealPlan.upsert.mockResolvedValue({ id: 'entry-1' })
    await mealPlanCollection({ method: 'GET', url: '/api/meal-plan?from=2026-08-14', headers: {} }, response())
    expect(mocks.mealPlan.list).toHaveBeenCalledWith('2026-08-14')
    await mealPlanCollection({ method: 'PUT', headers: {}, body: { date: '2026-08-15' } }, response())
    expect(mocks.mealPlan.upsert).toHaveBeenCalledWith({ date: '2026-08-15' })
  })
})

function response() {
  const result = { statusCode: 0, payload: undefined as unknown, status(code: number) { result.statusCode = code; return result }, json(body: unknown) { result.payload = body } }
  return result
}
