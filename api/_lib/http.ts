export type HeaderValue = string | string[] | undefined

export interface ApiRequest {
  method?: string
  url?: string
  query?: Record<string, string | string[] | undefined>
  headers: Record<string, HeaderValue>
  body?: unknown
  on?: (event: 'data' | 'end' | 'error', listener: (...args: unknown[]) => void) => void
}

export interface ApiResponse {
  statusCode?: number
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
  setHeader?: (name: string, value: string) => void
  end?: (body?: string) => void
}

export type ApiErrorCode = 'bad-request' | 'unauthorized' | 'forbidden' | 'not-found' | 'conflict' | 'validation' | 'internal'

export class ApiError extends Error {
  readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 500
  readonly code: ApiErrorCode

  constructor(status: 400 | 401 | 403 | 404 | 409 | 422 | 500, code: ApiErrorCode, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function sendJson(response: ApiResponse, status: number, body: unknown): void {
  response.setHeader?.('Cache-Control', 'private, no-store, max-age=0')
  response.setHeader?.('Vary', 'Authorization')
  response.status(status).json(body)
}

export function sendData(response: ApiResponse, data: unknown, status = 200): void {
  sendJson(response, status, { data })
}

export function sendError(response: ApiResponse, error: unknown): void {
  const apiError = error instanceof ApiError ? error : new ApiError(500, 'internal', 'Внутрішня помилка сервера')
  sendJson(response, apiError.status, { error: { code: apiError.code, message: apiError.message } })
}

export function header(request: ApiRequest, name: string): string | undefined {
  const value = request.headers[name.toLowerCase()] ?? request.headers[name]
  return Array.isArray(value) ? value[0] : value
}

export async function readJson<T>(request: ApiRequest): Promise<T> {
  if (request.body !== undefined) return request.body as T
  if (!request.on) throw new ApiError(400, 'bad-request', 'Некоректне тіло запиту')
  return new Promise<T>((resolve, reject) => {
    const chunks: Uint8Array[] = []
    request.on?.('data', (chunk) => chunks.push(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk as Uint8Array))
    request.on?.('error', () => reject(new ApiError(400, 'bad-request', 'Некоректне тіло запиту')))
    request.on?.('end', () => {
      try { resolve(JSON.parse(new TextDecoder().decode(concat(chunks))) as T) }
      catch { reject(new ApiError(400, 'bad-request', 'Некоректне тіло запиту')) }
    })
  })
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const length = chunks.reduce((total, chunk) => total + chunk.byteLength, 0)
  const result = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength }
  return result
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function queryParam(request: ApiRequest, name: string): string | undefined {
  const fromQuery = request.query?.[name]
  if (Array.isArray(fromQuery)) return fromQuery[0]
  if (fromQuery) return fromQuery
  try { return new URL(request.url ?? '', 'http://localhost').searchParams.get(name) ?? undefined }
  catch { return undefined }
}

export async function runApi(_request: ApiRequest, response: ApiResponse, action: () => Promise<unknown>, successStatus = 200): Promise<void> {
  try { sendData(response, await action(), successStatus) }
  catch (error) { sendError(response, error) }
}
