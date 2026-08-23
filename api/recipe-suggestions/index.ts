import { SupabaseRecipeRepository } from '../../src/supabase/SupabaseRecipeRepository.js'
import { authorized } from '../_lib/routes.js'
import { ApiError, queryParam, type ApiRequest, type ApiResponse } from '../_lib/http.js'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  await authorized(request, response, async ({ client, isAdmin }) => {
    const rawProductIds = queryParam(request, 'productIds')
    if (rawProductIds === undefined) throw new ApiError(400, 'bad-request', 'Оберіть хоча б один продукт')
    const productIds = parseProductIds(rawProductIds)
    return new SupabaseRecipeRepository(client, isAdmin).listByProductIds(productIds)
  }, 200, ['GET'])
}

function parseProductIds(value: string): string[] {
  const values = value.split(',')
  if (!values.length || values.some((productId) => !productId.trim())) {
    throw new ApiError(400, 'bad-request', 'Некоректний список продуктів')
  }
  return [...new Set(values.map((productId) => productId.trim()))]
}
