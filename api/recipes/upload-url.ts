import { authorized, jsonBody, requireRecord, requireString } from '../_lib/routes'
import { assertUploadPath } from '../_lib/upload'
import { R2Storage } from '../_lib/r2'
import { ApiError, type ApiRequest, type ApiResponse } from '../_lib/http'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  await authorized(request, response, async ({ user }) => {
    const body = requireRecord(await jsonBody(request))
    const recipeId = requireString(body.recipeId, 'recipeId')
    const mode = body.mode === 'update' ? 'update' : body.mode === 'create' ? 'create' : undefined
    if (!mode) throw new ApiError(400, 'bad-request', 'Оберіть режим завантаження фото')
    const path = mode === 'create' ? `${user.id}/${recipeId}.webp` : `${user.id}/${recipeId}-${Date.now()}.webp`
    assertUploadPath(user.id, recipeId, path, mode)
    const mimeType = typeof body.mimeType === 'string' && body.mimeType.startsWith('image/') ? body.mimeType : 'image/webp'
    try { return await new R2Storage().createSignedUploadUrl(path, mimeType) }
    catch { throw new ApiError(422, 'validation', 'Не вдалося створити URL завантаження фото') }
  }, 201, ['POST'])
}
