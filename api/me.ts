import { authorized, jsonBody, requireRecord } from './_lib/routes.js'
import { ApiError } from './_lib/http.js'
import type { ApiRequest, ApiResponse } from './_lib/http.js'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  await authorized(request, response, async ({ client, user, isAdmin }) => {
    if (request.method === 'PATCH') {
      const body = requireRecord(await jsonBody<unknown>(request))
      if (body.onboardingCompleted !== true) throw new ApiError(422, 'validation', 'Onboarding можна лише завершити')
      const { error } = await client.from('profiles').update({ onboarding_completed_at: new Date().toISOString() }).eq('id', user.id)
      if (error) throw profileStorageError(error, 'Не вдалося зберегти onboarding')
    }
    const { data: profile, error } = await client.from('profiles').select('onboarding_completed_at').eq('id', user.id).maybeSingle()
    if (error) throw profileStorageError(error, 'Не вдалося завантажити профіль')
    return {
      id: user.id,
      email: user.email ?? null,
      role: isAdmin ? 'admin' : 'user',
      isAdmin,
      onboardingCompleted: Boolean(profile?.onboarding_completed_at),
    }
  }, 200, ['GET', 'PATCH'])
}

function profileStorageError(error: unknown, fallback: string): ApiError {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  const message = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : ''
  if (code === '42703' || code === 'PGRST204' || message.includes('onboarding_completed_at')) {
    return new ApiError(503, 'schema-not-ready', 'Потрібно застосувати міграцію бази даних 20260815010000 і повторити дію.')
  }
  return new ApiError(500, 'internal', fallback)
}
