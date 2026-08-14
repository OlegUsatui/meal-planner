import { SupabaseProductRepository } from '../../src/supabase/SupabaseProductRepository.js'
import { authorized, jsonBody, requireRecord } from '../_lib/routes.js'
import type { ApiRequest, ApiResponse } from '../_lib/http.js'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  const id = routeId(request)
  await authorized(request, response, async ({ client }) => {
    const repository = new SupabaseProductRepository(client)
    if (request.method === 'GET') return repository.get(id)
    if (request.method === 'DELETE') return repository.archive(id).then(() => null)
    return repository.update(id, requireRecord(await jsonBody(request)) as never)
  }, 200, ['GET', 'PATCH', 'DELETE'])
}

function routeId(request: ApiRequest): string {
  const id = request.query?.id
  if (typeof id === 'string' && id) return id
  const value = request.url?.split('?')[0].split('/').filter(Boolean).pop()
  if (!value || value === 'products') throw new Error('Product id missing')
  return decodeURIComponent(value)
}
