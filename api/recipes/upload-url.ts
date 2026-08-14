import { authorized, jsonBody, requireRecord, requireString } from '../_lib/routes'
import { assertUploadPath } from '../_lib/upload'
import { ApiError, type ApiRequest, type ApiResponse } from '../_lib/http'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  await authorized(request, response, async ({ client, user }) => {
    const body = requireRecord(await jsonBody(request))
    const recipeId = requireString(body.recipeId, 'recipeId')
    const mode = body.mode === 'update' ? 'update' : body.mode === 'create' ? 'create' : undefined
    if (!mode) throw new ApiError(400, 'bad-request', 'Оберіть режим завантаження фото')
    const path = mode === 'create' ? `${user.id}/${recipeId}.webp` : `${user.id}/${recipeId}-${Date.now()}.webp`
    assertUploadPath(user.id, recipeId, path, mode)
    const { data, error } = await client.storage.from('recipe-images').createSignedUploadUrl(path, { upsert: mode === 'update' })
    if (error || !data) throw new ApiError(422, 'validation', 'Не вдалося створити URL завантаження фото')
    return data
  }, 201, ['POST'])
}
