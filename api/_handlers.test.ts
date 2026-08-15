import { describe, expect, it, vi } from 'vitest'
import recipeCollection from './recipes/index.js'
import recipeItem from './recipes/[id].js'
import productCollection from './products/index.js'
import mealPlanCollection from './meal-plan/index.js'
import me from './me.js'
import dashboard from './dashboard.js'
import shoppingList from './shopping-list.js'

const mocks = vi.hoisted(() => ({
  auth: vi.fn().mockResolvedValue({ client: {}, user: { id: 'user-1', email: 'user@example.com' }, isAdmin: false }),
  recipes: { list: vi.fn(), listPage: vi.fn(), get: vi.fn(), createUploaded: vi.fn(), update: vi.fn(), updateUploaded: vi.fn(), archive: vi.fn(), remove: vi.fn() },
  products: { list: vi.fn(), listPage: vi.fn(), create: vi.fn(), remove: vi.fn() },
  mealPlan: { list: vi.fn(), upsert: vi.fn() },
  dashboard: { get: vi.fn() },
  shopping: { list: vi.fn() },
}))

vi.mock('./_lib/auth', () => ({ authenticate: mocks.auth }))
vi.mock('../src/supabase/SupabaseRecipeRepository', () => ({ SupabaseRecipeRepository: class { constructor() { return mocks.recipes as never } } }))
vi.mock('../src/supabase/SupabaseProductRepository', () => ({ SupabaseProductRepository: class { constructor() { return mocks.products as never } } }))
vi.mock('../src/supabase/SupabaseMealPlanRepository', () => ({ SupabaseMealPlanRepository: class { constructor() { return mocks.mealPlan as never } } }))
vi.mock('../src/supabase/SupabaseDashboardRepository', () => ({ SupabaseDashboardRepository: class { constructor() { return mocks.dashboard as never } } }))
vi.mock('../src/supabase/SupabaseShoppingListRepository', () => ({ SupabaseShoppingListRepository: class { constructor() { return mocks.shopping as never } } }))

describe('REST handlers', () => {
  it('handles recipe collection GET and POST', async () => {
    mocks.recipes.list.mockResolvedValueOnce([{ id: 'recipe-1' }])
    mocks.recipes.createUploaded.mockResolvedValueOnce({ id: 'recipe-2' })
    const getResponse = response()
    await recipeCollection({ method: 'GET', url: '/api/recipes?query=soup', headers: {} }, getResponse)
    expect(getResponse.payload).toEqual({ data: [{ id: 'recipe-1' }] })
    expect(mocks.recipes.list).toHaveBeenCalledWith('soup', { mealType: undefined, systemOnly: undefined })

    await recipeCollection({ method: 'GET', url: '/api/recipes?systemOnly=true&mealType=dinner', headers: {} }, response())
    expect(mocks.recipes.list).toHaveBeenLastCalledWith('', { mealType: 'dinner', systemOnly: true })

    mocks.recipes.listPage.mockResolvedValueOnce({ items: [], page: 2, pageSize: 24, total: 50, hasNext: true })
    await recipeCollection({ method: 'GET', url: '/api/recipes?query=soup&page=2&pageSize=24&mealType=lunch&subcategoryId=lunch-soups', headers: {} }, response())
    expect(mocks.recipes.listPage).toHaveBeenCalledWith('soup', { page: 2, pageSize: 24, mealType: 'lunch', subcategoryId: 'lunch-soups', uncategorized: false, includeArchived: false })

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

  it('exposes the authenticated role and routes permanent recipe deletion to the repository', async () => {
    const profileQuery = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: { onboarding_completed_at: null }, error: null }), update: vi.fn() }
    profileQuery.select.mockReturnValue(profileQuery); profileQuery.eq.mockReturnValue(profileQuery); profileQuery.update.mockReturnValue(profileQuery)
    const client = { from: vi.fn().mockReturnValue(profileQuery) }
    mocks.auth.mockResolvedValueOnce({ client, user: { id: 'admin-1', email: 'admin@example.com' }, isAdmin: true })
    const meResponse = response()
    await me({ method: 'GET', headers: {} }, meResponse)
    expect(meResponse.payload).toEqual({ data: { id: 'admin-1', email: 'admin@example.com', role: 'admin', isAdmin: true, onboardingCompleted: false } })

    profileQuery.maybeSingle.mockResolvedValueOnce({ data: { onboarding_completed_at: '2026-08-15T10:00:00.000Z' }, error: null })
    mocks.auth.mockResolvedValueOnce({ client, user: { id: 'admin-1', email: 'admin@example.com' }, isAdmin: true })
    const patchResponse = response()
    await me({ method: 'PATCH', headers: {}, body: { onboardingCompleted: true } }, patchResponse)
    expect(profileQuery.update).toHaveBeenCalledWith(expect.objectContaining({ onboarding_completed_at: expect.any(String) }))
    expect(patchResponse.payload).toEqual({ data: { id: 'admin-1', email: 'admin@example.com', role: 'admin', isAdmin: true, onboardingCompleted: true } })

    mocks.auth.mockResolvedValueOnce({ client: {}, user: { id: 'admin-1' }, isAdmin: true })
    await recipeItem({ method: 'DELETE', url: '/api/recipes/system:1?permanent=true', headers: {} }, response())
    expect(mocks.recipes.remove).toHaveBeenCalledWith('system:1')
  })

  it('reports an unapplied onboarding migration as an actionable service error', async () => {
    const profileQuery = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { code: '42703', message: 'column profiles.onboarding_completed_at does not exist' } }) }
    profileQuery.select.mockReturnValue(profileQuery); profileQuery.eq.mockReturnValue(profileQuery)
    mocks.auth.mockResolvedValueOnce({ client: { from: vi.fn().mockReturnValue(profileQuery) }, user: { id: 'user-1', email: 'user@example.com' }, isAdmin: false })
    const apiResponse = response()

    await me({ method: 'GET', headers: {} }, apiResponse)

    expect(apiResponse.statusCode).toBe(503)
    expect(apiResponse.payload).toEqual({ error: { code: 'schema-not-ready', message: expect.stringContaining('міграцію бази даних') } })
  })

  it('handles product collection and meal-plan collection', async () => {
    mocks.products.list.mockResolvedValue([])
    mocks.products.create.mockResolvedValue({ id: 'product-1' })
    await productCollection({ method: 'GET', url: '/api/products?query=rice', headers: {} }, response())
    expect(mocks.products.list).toHaveBeenCalledWith({ query: 'rice', category: undefined, includeArchived: false })
    mocks.products.listPage.mockResolvedValueOnce({ items: [], page: 2, pageSize: 24, total: 50, hasNext: true })
    await productCollection({ method: 'GET', url: '/api/products?query=rice&page=2&pageSize=24&includeArchived=true', headers: {} }, response())
    expect(mocks.products.listPage).toHaveBeenCalledWith({ query: 'rice', category: undefined, includeArchived: true, page: 2, pageSize: 24 })
    await productCollection({ method: 'POST', headers: {}, body: { name: 'Rice' } }, response())
    expect(mocks.products.create).toHaveBeenCalledWith({ name: 'Rice' })

    mocks.mealPlan.list.mockResolvedValue([])
    mocks.mealPlan.upsert.mockResolvedValue({ id: 'entry-1' })
    await mealPlanCollection({ method: 'GET', url: '/api/meal-plan?from=2026-08-14&to=2026-08-20', headers: {} }, response())
    expect(mocks.mealPlan.list).toHaveBeenCalledWith({ from: '2026-08-14', to: '2026-08-20' })
    await mealPlanCollection({ method: 'PUT', headers: {}, body: { date: '2026-08-15' } }, response())
    expect(mocks.mealPlan.upsert).toHaveBeenCalledWith({ date: '2026-08-15' })
  })

  it('handles dashboard and ranged shopping projections', async () => {
    mocks.dashboard.get.mockResolvedValue({ today: '2026-08-14' })
    mocks.shopping.list.mockResolvedValue([])
    await dashboard({ method: 'GET', url: '/api/dashboard?today=2026-08-14', headers: {} }, response())
    expect(mocks.dashboard.get).toHaveBeenCalledWith('2026-08-14')
    await shoppingList({ method: 'GET', url: '/api/shopping-list?from=2026-08-14&to=2026-08-20', headers: {} }, response())
    expect(mocks.shopping.list).toHaveBeenCalledWith({ from: '2026-08-14', to: '2026-08-20' })
  })
})

function response() {
  const result = { statusCode: 0, payload: undefined as unknown, status(code: number) { result.statusCode = code; return result }, json(body: unknown) { result.payload = body } }
  return result
}
