import { SupabaseRecipeRepository } from '../../src/supabase/SupabaseRecipeRepository.js'
import type { RecipeListFilters, RecipeListOptions } from '../../src/features/recipes/repositories/recipe-repository.js'
import type { RecipeMealType } from '../../src/features/recipes/domain/recipe-taxonomy.js'
import { authorized, jsonBody, requireRecord, requireString } from '../_lib/routes.js'
import { ApiError, queryParam, type ApiRequest, type ApiResponse } from '../_lib/http.js'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  await authorized(request, response, async ({ client, isAdmin }) => {
    const repository = new SupabaseRecipeRepository(client, isAdmin)
    if (request.method === 'GET') {
      const query = queryParam(request, 'query') ?? ''
      const page = queryParam(request, 'page')
      const pageSize = queryParam(request, 'pageSize')
      const mealType = queryParam(request, 'mealType')
      const subcategoryId = queryParam(request, 'subcategoryId')
      const uncategorized = queryParam(request, 'uncategorized')
      const includeArchived = queryParam(request, 'includeArchived')
      const systemOnly = queryParam(request, 'systemOnly')
      const filters = parseListFilters({ mealType, systemOnly })
      const rawProductIds = queryParam(request, 'productIds')
      if (rawProductIds !== undefined) return repository.listByProductIds(parseProductIds(rawProductIds))
      if (![page, pageSize, subcategoryId, uncategorized, includeArchived].some((value) => value !== undefined)) return repository.list(query, filters)
      if (!repository.listPage) throw new ApiError(500, 'internal', 'Пагінація рецептів недоступна')
      const options = parseListOptions({ page, pageSize, mealType, subcategoryId, uncategorized, includeArchived, systemOnly })
      if (options.includeArchived && !isAdmin) throw new ApiError(403, 'forbidden', 'Архівні рецепти доступні лише адміністратору')
      return repository.listPage(query, options)
    }
    const body = requireRecord(await jsonBody(request))
    const id = requireString(body.id, 'id')
    return repository.createUploaded(id, body as never)
  }, request.method === 'POST' ? 201 : 200, ['GET', 'POST'])
}

function parseProductIds(value: string): string[] {
  const values = value.split(',')
  if (!values.length || values.some((productId) => !productId.trim())) {
    throw new ApiError(400, 'bad-request', 'Некоректний список продуктів')
  }
  return [...new Set(values.map((productId) => productId.trim()))]
}

function parseListOptions(values: Record<string, string | undefined>): RecipeListOptions {
  const page = positiveInteger(values.page, 1, 'page')
  const pageSize = positiveInteger(values.pageSize, 24, 'pageSize', 100)
  const uncategorized = values.uncategorized === undefined ? false : values.uncategorized === 'true' ? true : values.uncategorized === 'false' ? false : undefined
  if (uncategorized === undefined) throw new ApiError(400, 'bad-request', 'Некоректний параметр uncategorized')
  const includeArchived = values.includeArchived === undefined ? false : values.includeArchived === 'true' ? true : values.includeArchived === 'false' ? false : undefined
  if (includeArchived === undefined) throw new ApiError(400, 'bad-request', 'Некоректний параметр includeArchived')
  return { page, pageSize, ...parseListFilters(values), subcategoryId: values.subcategoryId, uncategorized, includeArchived }
}

function parseListFilters(values: Record<string, string | undefined>): RecipeListFilters {
  const mealType = values.mealType
  if (mealType && !['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) throw new ApiError(400, 'bad-request', 'Некоректний тип прийому їжі')
  const systemOnly = booleanParam(values.systemOnly, 'systemOnly')
  return { mealType: mealType as RecipeMealType | undefined, systemOnly }
}

function booleanParam(value: string | undefined, field: string): boolean | undefined {
  if (value === undefined) return undefined
  if (value === 'true') return true
  if (value === 'false') return false
  throw new ApiError(400, 'bad-request', `Некоректний параметр ${field}`)
}

function positiveInteger(value: string | undefined, fallback: number, field: string, max = Number.MAX_SAFE_INTEGER): number {
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) throw new ApiError(400, 'bad-request', `Некоректний параметр ${field}`)
  return parsed
}
