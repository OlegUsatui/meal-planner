import { SupabaseShoppingListRepository } from '../src/supabase/SupabaseShoppingListRepository'
import { authorized } from './_lib/routes'
import { queryParam, type ApiRequest, type ApiResponse } from './_lib/http'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  await authorized(request, response, async ({ client }) => new SupabaseShoppingListRepository(client).list(queryParam(request, 'today')), 200, ['GET'])
}
