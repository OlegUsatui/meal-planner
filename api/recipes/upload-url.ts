import { authorized, jsonBody, requireRecord, requireString } from '../_lib/routes.js'
import { assertUploadPath } from '../_lib/upload.js'
import { R2Storage } from '../_lib/r2.js'
import { ApiError, type ApiRequest, type ApiResponse } from '../_lib/http.js'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  await authorized(request, response, async ({ client, user, isAdmin }) => {
    const body = requireRecord(await jsonBody(request))
    const recipeId = requireString(body.recipeId, 'recipeId')
    const mode = body.mode === 'update' ? 'update' : body.mode === 'create' ? 'create' : undefined
    if (!mode) throw new ApiError(400, 'bad-request', 'Оберіть режим завантаження фото')
    let path: string
    if (mode === 'create') {
      path = `${user.id}/${recipeId}.webp`
    } else {
      const { data: recipe, error } = await client.from('recipes').select('owner_id').eq('id', recipeId).maybeSingle()
      if (error || !recipe) throw new ApiError(404, 'not-found', 'Рецепт не знайдено')
      if (recipe.owner_id === null && !isAdmin) throw new ApiError(403, 'forbidden', 'Системний рецепт може змінювати лише адміністратор')
      path = recipe.owner_id === null
        ? `system/${recipeId}-${Date.now()}.webp`
        : isAdmin && recipe.owner_id !== user.id
          ? `admin/${user.id}/${recipeId}-${Date.now()}.webp`
          : `${user.id}/${recipeId}-${Date.now()}.webp`
    }
    assertUploadPath(user.id, recipeId, path, mode, isAdmin)
    const mimeType = typeof body.mimeType === 'string' && body.mimeType.startsWith('image/') ? body.mimeType : 'image/webp'
    try { return await new R2Storage().createSignedUploadUrl(path, mimeType) }
    catch { throw new ApiError(422, 'validation', 'Не вдалося створити URL завантаження фото') }
  }, 201, ['POST'])
}
