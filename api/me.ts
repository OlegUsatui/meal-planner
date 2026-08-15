import { authorized } from './_lib/routes.js'
import type { ApiRequest, ApiResponse } from './_lib/http.js'

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  await authorized(request, response, async ({ user, isAdmin }) => ({
    id: user.id,
    email: user.email ?? null,
    role: isAdmin ? 'admin' : 'user',
    isAdmin,
  }), 200, ['GET'])
}
