import { SupabaseRecipeRepository } from '../../src/supabase/SupabaseRecipeRepository'
import { authorized, jsonBody, requireRecord, requireString } from '../_lib/routes'
import { queryParam, type ApiRequest, type ApiResponse } from '../_lib/http'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  await authorized(request, response, async ({ client }) => {
    const repository = new SupabaseRecipeRepository(client)
    if (request.method === 'GET') return repository.list(queryParam(request, 'query') ?? '')
    const body = requireRecord(await jsonBody(request))
    const id = requireString(body.id, 'id')
    return repository.createUploaded(id, body as never)
  }, request.method === 'POST' ? 201 : 200, ['GET', 'POST'])
}
