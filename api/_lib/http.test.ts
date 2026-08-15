import { describe, expect, it } from 'vitest'
import { ApiError, sendError, type ApiResponse } from './http.js'

describe('API error mapping', () => {
  it('returns the standard error envelope', () => {
    const response = mockResponse()
    sendError(response, new ApiError(422, 'validation', 'Некоректний рецепт'))
    expect(response.statusCode).toBe(422)
    expect(response.payload).toEqual({ error: { code: 'validation', message: 'Некоректний рецепт' } })
  })

  it('does not expose unknown server errors', () => {
    const response = mockResponse()
    sendError(response, new Error('secret database details'))
    expect(response.statusCode).toBe(500)
    expect(response.payload).toEqual({ error: { code: 'internal', message: 'Внутрішня помилка сервера' } })
  })

  it('disables caching for API responses', () => {
    const response = mockResponse()
    sendError(response, new ApiError(401, 'unauthorized', 'Потрібна авторизація'))
    expect(response.headers).toEqual({ 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Authorization' })
  })
})

function mockResponse() {
  const response = {} as ApiResponse & { payload: unknown; headers: Record<string, string> }
  response.statusCode = 0
  response.payload = undefined
  response.headers = {}
  response.setHeader = (name, value) => { response.headers[name] = value }
  response.status = (code) => { response.statusCode = code; return response }
  response.json = (body) => { response.payload = body }
  return response
}
