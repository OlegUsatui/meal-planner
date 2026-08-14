import { SupabaseProductRepository } from '../../src/supabase/SupabaseProductRepository.js'
import { authorized, jsonBody, requireRecord } from '../_lib/routes.js'
import { queryParam, type ApiRequest, type ApiResponse } from '../_lib/http.js'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  await authorized(request, response, async ({ client }) => {
    const repository = new SupabaseProductRepository(client)
    if (request.method === 'GET') return repository.list({ query: queryParam(request, 'query'), category: queryParam(request, 'category'), includeArchived: queryParam(request, 'includeArchived') === 'true' })
    return repository.create(requireRecord(await jsonBody(request)) as never)
  }, request.method === 'POST' ? 201 : 200, ['GET', 'POST'])
}
