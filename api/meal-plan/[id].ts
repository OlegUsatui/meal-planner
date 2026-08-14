import { SupabaseMealPlanRepository } from '../../src/supabase/SupabaseMealPlanRepository.js'
import { authorized } from '../_lib/routes.js'
import type { ApiRequest, ApiResponse } from '../_lib/http.js'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  const id = routeId(request)
  await authorized(request, response, async ({ client }) => new SupabaseMealPlanRepository(client).remove(id).then(() => null), 200, ['DELETE'])
}

function routeId(request: ApiRequest): string {
  const id = request.query?.id
  if (typeof id === 'string' && id) return id
  const value = request.url?.split('?')[0].split('/').filter(Boolean).pop()
  if (!value || value === 'meal-plan') throw new Error('Meal plan id missing')
  return decodeURIComponent(value)
}
