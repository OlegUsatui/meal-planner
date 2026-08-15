import { SupabaseRecipeRepository } from '../../src/supabase/SupabaseRecipeRepository.js'
import type { RecipeListOptions } from '../../src/features/recipes/repositories/recipe-repository.js'
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
      if (![page, pageSize, mealType, subcategoryId, uncategorized, includeArchived].some((value) => value !== undefined)) return repository.list(query)
      if (!repository.listPage) throw new ApiError(500, 'internal', 'Пагінація рецептів недоступна')
      const options = parseListOptions({ page, pageSize, mealType, subcategoryId, uncategorized, includeArchived })
      if (options.includeArchived && !isAdmin) throw new ApiError(403, 'forbidden', 'Архівні рецепти доступні лише адміністратору')
      return repository.listPage(query, options)
    }
    const body = requireRecord(await jsonBody(request))
    const id = requireString(body.id, 'id')
    return repository.createUploaded(id, body as never)
  }, request.method === 'POST' ? 201 : 200, ['GET', 'POST'])
}

function parseListOptions(values: Record<string, string | undefined>): RecipeListOptions {
  const page = positiveInteger(values.page, 1, 'page')
  const pageSize = positiveInteger(values.pageSize, 24, 'pageSize', 100)
  const mealType = values.mealType
  if (mealType && !['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) throw new ApiError(400, 'bad-request', 'Некоректний тип прийому їжі')
  const uncategorized = values.uncategorized === undefined ? false : values.uncategorized === 'true' ? true : values.uncategorized === 'false' ? false : undefined
  if (uncategorized === undefined) throw new ApiError(400, 'bad-request', 'Некоректний параметр uncategorized')
  const includeArchived = values.includeArchived === undefined ? false : values.includeArchived === 'true' ? true : values.includeArchived === 'false' ? false : undefined
  if (includeArchived === undefined) throw new ApiError(400, 'bad-request', 'Некоректний параметр includeArchived')
  return { page, pageSize, mealType: mealType as RecipeMealType | undefined, subcategoryId: values.subcategoryId, uncategorized, includeArchived }
}

function positiveInteger(value: string | undefined, fallback: number, field: string, max = Number.MAX_SAFE_INTEGER): number {
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) throw new ApiError(400, 'bad-request', `Некоректний параметр ${field}`)
  return parsed
}
