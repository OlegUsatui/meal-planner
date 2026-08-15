import { SupabaseDashboardRepository } from '../src/supabase/SupabaseDashboardRepository.js'
import { authorized } from './_lib/routes.js'
import { queryParam, type ApiRequest, type ApiResponse } from './_lib/http.js'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  await authorized(request, response, async ({ client }) => {
    const today = queryParam(request, 'today') ?? new Intl.DateTimeFormat('sv-SE').format(new Date())
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new Error('Некоректна дата')
    return new SupabaseDashboardRepository(client).get(today)
  }, 200, ['GET'])
}
