import { SupabaseRecipeRepository } from '../../src/supabase/SupabaseRecipeRepository'
import { authorized, jsonBody, requireRecord } from '../_lib/routes'
import type { ApiRequest, ApiResponse } from '../_lib/http'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  const id = routeId(request)
  await authorized(request, response, async ({ client }) => {
    const repository = new SupabaseRecipeRepository(client)
    if (request.method === 'GET') return repository.get(id)
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
