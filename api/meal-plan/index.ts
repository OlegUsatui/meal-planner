import { SupabaseMealPlanRepository } from '../../src/supabase/SupabaseMealPlanRepository'
import { authorized, jsonBody, requireRecord } from '../_lib/routes'
import { queryParam, type ApiRequest, type ApiResponse } from '../_lib/http'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  await authorized(request, response, async ({ client }) => {
    const repository = new SupabaseMealPlanRepository(client)
    if (request.method === 'GET') return repository.list(queryParam(request, 'from'))
    return repository.upsert(requireRecord(await jsonBody(request)) as never)
  }, 200, ['GET', 'PUT'])
}
