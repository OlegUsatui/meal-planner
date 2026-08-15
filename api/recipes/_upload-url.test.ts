import { describe, expect, it, vi } from 'vitest'
import handler from './upload-url.js'

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  createSignedUploadUrl: vi.fn().mockResolvedValue({ path: 'system/recipe-1-next.webp', signedUrl: 'https://upload.example' }),
}))

vi.mock('../_lib/auth', () => ({ authenticate: mocks.authenticate }))
vi.mock('../_lib/r2', () => ({ R2Storage: class { createSignedUploadUrl = mocks.createSignedUploadUrl } }))

describe('recipe image upload authorization', () => {
  it('creates a system image path only for an admin', async () => {
    const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: { owner_id: null }, error: null }) }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    mocks.authenticate.mockResolvedValue({ client: { from: vi.fn().mockReturnValue(query) }, user: { id: 'admin-1' }, isAdmin: true })

    const response = createResponse()
    await handler({ method: 'POST', headers: {}, body: { recipeId: 'recipe-1', mode: 'update', mimeType: 'image/webp' } }, response)

    expect(response.statusCode).toBe(201)
    expect(mocks.createSignedUploadUrl).toHaveBeenCalledWith(expect.stringMatching(/^system\/recipe-1-\d+\.webp$/u), 'image/webp')
  })

  it('rejects a non-admin system recipe upload', async () => {
    const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: { owner_id: null }, error: null }) }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    mocks.authenticate.mockResolvedValue({ client: { from: vi.fn().mockReturnValue(query) }, user: { id: 'user-1' }, isAdmin: false })

    const response = createResponse()
    await handler({ method: 'POST', headers: {}, body: { recipeId: 'recipe-1', mode: 'update', mimeType: 'image/webp' } }, response)

    expect(response.statusCode).toBe(403)
    expect(response.payload).toMatchObject({ error: { code: 'forbidden' } })
  })
})

function createResponse() {
  const result = { statusCode: 0, payload: undefined as unknown, status(code: number) { result.statusCode = code; return result }, json(body: unknown) { result.payload = body } }
  return result
}
