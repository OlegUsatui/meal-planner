import { SupabaseShoppingListRepository } from '../src/supabase/SupabaseShoppingListRepository.js'
import { authorized } from './_lib/routes.js'
import { queryParam, type ApiRequest, type ApiResponse } from './_lib/http.js'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  await authorized(request, response, async ({ client }) => new SupabaseShoppingListRepository(client).list({ from: queryParam(request, 'from') ?? new Intl.DateTimeFormat('sv-SE').format(new Date()), to: queryParam(request, 'to') }), 200, ['GET'])
}
