import { SupabaseMealPlanRepository } from '../../src/supabase/SupabaseMealPlanRepository.js'
import type { MealSlot } from '../../src/features/meal-planner/domain/meal-plan.js'
import { authorized, jsonBody, requireRecord, requireString } from '../_lib/routes.js'
import type { ApiRequest, ApiResponse } from '../_lib/http.js'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  await authorized(request, response, async ({ client }) => {
    const body = requireRecord(await jsonBody(request))
    await new SupabaseMealPlanRepository(client).move(requireString(body.entryId, 'entryId'), requireString(body.targetDate, 'targetDate'), requireString(body.targetSlot, 'targetSlot') as MealSlot)
    return null
  }, 200, ['PUT'])
}
