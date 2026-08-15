import { supabase } from '../lib/supabase'
import type { RecipeImageInput } from '../features/recipes/types'

interface ApiEnvelope<T> { data: T }
interface ApiErrorEnvelope { error?: { code?: string; message?: string } }

export class ApiClientError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = code
  }
}

export interface SignedUpload {
  path: string
  signedUrl: string
}

export class ApiClient {
  async get<T>(path: string, options?: { signal?: AbortSignal }): Promise<T> {
    return this.request<T>(path, { signal: options?.signal })
  }

  async post<T>(path: string, body: unknown): Promise<T> { return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) }) }

  async patch<T>(path: string, body: unknown): Promise<T> { return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }) }

  async put<T>(path: string, body: unknown): Promise<T> { return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) }) }

  async delete<T>(path: string): Promise<T> { return this.request<T>(path, { method: 'DELETE' }) }

  async uploadRecipeImage(recipeId: string, image: RecipeImageInput, mode: 'create' | 'update'): Promise<SignedUpload> {
    if (!image.blob) throw new ApiClientError(422, 'validation', 'Додайте фото рецепту')
    const upload = await this.post<SignedUpload>('/api/recipes/upload-url', { recipeId, mode, mimeType: image.mimeType })
    const response = await fetch(upload.signedUrl, { method: 'PUT', headers: { 'Content-Type': image.mimeType }, body: image.blob })
    if (!response.ok) throw new ApiClientError(422, 'validation', 'Не вдалося завантажити фото рецепту')
    return upload
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    throwIfAborted(init.signal)
    const token = await this.accessToken()
    throwIfAborted(init.signal)
    if (!token) throw new ApiClientError(401, 'unauthorized', 'Потрібна авторизація')
    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${token}`)
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    const response = await fetch(path, { ...init, headers, cache: 'no-store' })
    const payload = await parsePayload(response)
    if (!response.ok) {
      const error = payload as ApiErrorEnvelope
      if (response.status === 401) window.dispatchEvent(new Event('meal-planner:session-expired'))
      throw new ApiClientError(response.status, error.error?.code ?? 'internal', error.error?.message ?? 'Не вдалося виконати запит')
    }
    return (payload as ApiEnvelope<T>).data
  }

  private async accessToken(): Promise<string | null> {
    if (!supabase) return null
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }
}

function throwIfAborted(signal: AbortSignal | null | undefined): void {
  if (signal?.aborted) throw signal.reason ?? new DOMException('The operation was aborted.', 'AbortError')
}

async function parsePayload(response: Response): Promise<unknown> {
  if (response.status === 204) return { data: null }
  try { return await response.json() as unknown }
  catch { return {} }
}
