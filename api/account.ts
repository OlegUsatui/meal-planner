import { bearerToken } from './_lib/auth.js'
import { ApiError, type ApiRequest, type ApiResponse } from './_lib/http.js'
import { R2Storage } from './_lib/r2.js'
import { authorized } from './_lib/routes.js'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  await authorized(request, response, async ({ client, user }) => {
    assertFreshJwt(bearerToken(request))
    const { data: recipes, error: recipesError } = await client.from('recipes').select('image_path').eq('owner_id', user.id)
    if (recipesError) throw new ApiError(500, 'account-delete-partial', 'Не вдалося перевірити особисті фото. Спробуйте ще раз.')
    const storage = new R2Storage()
    for (const recipe of recipes ?? []) {
      const path = typeof recipe.image_path === 'string' ? recipe.image_path : null
      if (path) try { await storage.remove(path) } catch { throw new ApiError(503, 'account-delete-partial', 'Не вдалося видалити всі особисті фото. Повторіть дію.') }
    }
    const { error } = await client.rpc('delete_own_account')
    if (error) throw new ApiError(503, 'account-delete-partial', 'Не вдалося завершити видалення акаунта. Повторіть дію.')
    return null
  }, 200, ['DELETE'])
}

export function assertFreshJwt(token: string, nowSeconds = Math.floor(Date.now() / 1000), maxAgeSeconds = 300): void {
  try {
    const payload = JSON.parse(decodeBase64Url(token.split('.')[1] ?? '')) as { iat?: unknown }
    if (typeof payload.iat !== 'number' || nowSeconds - payload.iat > maxAgeSeconds || payload.iat > nowSeconds + 30) throw new Error('stale')
  } catch { throw new ApiError(401, 'reauthentication-required', 'Повторно увійдіть до акаунта перед видаленням.') }
}

function decodeBase64Url(value: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const normalized = value.replace(/-/gu, '+').replace(/_/gu, '/').replace(/=+$/u, '')
  if (!normalized || normalized.length % 4 === 1) throw new Error('invalid-base64')
  const bytes: number[] = []
  let buffer = 0
  let bits = 0
  for (const character of normalized) {
    const digit = alphabet.indexOf(character)
    if (digit < 0) throw new Error('invalid-base64')
    buffer = (buffer << 6) | digit
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes.push((buffer >> bits) & 0xff)
      buffer &= bits === 0 ? 0 : (1 << bits) - 1
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes))
}
