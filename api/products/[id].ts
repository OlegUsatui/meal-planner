import { SupabaseProductRepository } from '../../src/supabase/SupabaseProductRepository.js'
import { authorized, jsonBody, requireRecord } from '../_lib/routes.js'
import { ApiError, queryParam, type ApiRequest, type ApiResponse } from '../_lib/http.js'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  const id = routeId(request)
  await authorized(request, response, async ({ client, isAdmin }) => {
    const permanent = queryParam(request, 'permanent') === 'true'
    const action = queryParam(request, 'action')
    if (permanent && !isAdmin) throw new ApiError(403, 'forbidden', 'Безповоротно видаляти продукти може лише адміністратор')
    const repository = new SupabaseProductRepository(client, isAdmin)
    if (request.method === 'GET') return repository.get(id)
    if (request.method === 'DELETE' && permanent) return repository.remove(id).then(() => null)
    if (request.method === 'DELETE') return repository.archive(id).then(() => null)
    if (request.method === 'PATCH' && action === 'restore') return repository.restore(id).then(() => null)
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
