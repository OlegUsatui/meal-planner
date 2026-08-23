import { describe, expect, it, vi } from 'vitest'
import handler from './index'

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  listByProductIds: vi.fn(),
}))

vi.mock('../_lib/auth', () => ({ authenticate: mocks.authenticate }))
vi.mock('../../src/supabase/SupabaseRecipeRepository.js', () => ({
  SupabaseRecipeRepository: class {
    listByProductIds = mocks.listByProductIds
  },
}))

describe('recipes API product suggestions', () => {
  it('handles product suggestions through the recipes endpoint', async () => {
    mocks.authenticate.mockResolvedValue({ client: {}, isAdmin: false, user: { id: 'user-1' } })
    mocks.listByProductIds.mockResolvedValue([])
    const response = createResponse()

    await handler({ method: 'GET', headers: {}, query: { productIds: 'product-2, product-1,product-2' } }, response)

    expect(response.statusCode).toBe(200)
    expect(mocks.listByProductIds).toHaveBeenCalledWith(['product-2', 'product-1'])
  })

  it('rejects an empty product id in the suggestions query', async () => {
    mocks.authenticate.mockResolvedValue({ client: {}, isAdmin: false, user: { id: 'user-1' } })
    const response = createResponse()

    await handler({ method: 'GET', headers: {}, query: { productIds: 'product-1,,product-2' } }, response)

    expect(response.statusCode).toBe(400)
    expect(response.payload).toMatchObject({ error: { code: 'bad-request' } })
    expect(mocks.listByProductIds).not.toHaveBeenCalled()
  })
})

function createResponse() {
  const result = {
    statusCode: 0,
    payload: undefined as unknown,
    status(code: number) { result.statusCode = code; return result },
    json(body: unknown) { result.payload = body },
  }
  return result
}
