import { SupabaseRecipeRepository } from '../../src/supabase/SupabaseRecipeRepository.js'
import { authorized, jsonBody, requireRecord } from '../_lib/routes.js'
import { ApiError, queryParam, type ApiRequest, type ApiResponse } from '../_lib/http.js'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  const id = routeId(request)
  await authorized(request, response, async ({ client, isAdmin }) => {
    const permanent = queryParam(request, 'permanent') === 'true'
    if (permanent && !isAdmin) throw new ApiError(403, 'forbidden', 'Безповоротно видаляти рецепти може лише адміністратор')
    const repository = new SupabaseRecipeRepository(client, isAdmin)
    if (request.method === 'GET') return repository.get(id)
    if (request.method === 'DELETE' && permanent) return repository.remove(id).then(() => null)
    if (request.method === 'DELETE') return repository.archive(id).then(() => null)
    const body = requireRecord(await jsonBody(request))
    return body.image && typeof body.image === 'object' ? repository.updateUploaded(id, body as never) : repository.update(id, body as never)
  }, 200, ['GET', 'PATCH', 'DELETE'])
}

function routeId(request: ApiRequest): string {
  const id = request.query?.id
  if (typeof id === 'string' && id) return id
  const value = request.url?.split('?')[0].split('/').filter(Boolean).pop()
  if (!value || value === 'recipes') throw new Error('Recipe id missing')
  return decodeURIComponent(value)
}
