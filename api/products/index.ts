import { SupabaseProductRepository } from '../../src/supabase/SupabaseProductRepository.js'
import { authorized, jsonBody, requireRecord } from '../_lib/routes.js'
import { ApiError, queryParam, type ApiRequest, type ApiResponse } from '../_lib/http.js'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  await authorized(request, response, async ({ client, isAdmin }) => {
    const repository = new SupabaseProductRepository(client, isAdmin)
    if (request.method === 'GET') {
      const page = queryParam(request, 'page')
      const pageSize = queryParam(request, 'pageSize')
      const options = { query: queryParam(request, 'query'), category: queryParam(request, 'category'), includeArchived: queryParam(request, 'includeArchived') === 'true' }
      if (page === undefined && pageSize === undefined) return repository.list(options)
      if (!repository.listPage) throw new ApiError(500, 'internal', 'Пагінація продуктів недоступна')
      return repository.listPage({ ...options, page: positiveInteger(page, 1, 'page'), pageSize: positiveInteger(pageSize, 24, 'pageSize', 100) })
    }
    return repository.create(requireRecord(await jsonBody(request)) as never)
  }, request.method === 'POST' ? 201 : 200, ['GET', 'POST'])
}

function positiveInteger(value: string | undefined, fallback: number, field: string, max = Number.MAX_SAFE_INTEGER): number {
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) throw new ApiError(400, 'bad-request', `Некоректний параметр ${field}`)
  return parsed
}
