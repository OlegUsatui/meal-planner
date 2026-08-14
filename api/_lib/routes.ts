import { MealPlanRepositoryError } from '../../src/features/meal-planner/types'
import { ProductRepositoryError } from '../../src/features/products/repositories/product-repository'
import { RecipeRepositoryError } from '../../src/features/recipes/repositories/recipe-repository'
import { authenticate, type AuthContext } from './auth'
import { ApiError, readJson, sendData, sendError, type ApiRequest, type ApiResponse } from './http'

export function method(request: ApiRequest, ...allowed: string[]): void {
  if (!allowed.includes(request.method ?? '')) throw new ApiError(400, 'bad-request', 'Метод запиту не підтримується')
}

export async function authorized(request: ApiRequest, response: ApiResponse, action: (context: AuthContext) => Promise<unknown>, status = 200, allowedMethods?: string[]): Promise<void> {
  try {
    if (allowedMethods && !allowedMethods.includes(request.method ?? '')) throw new ApiError(400, 'bad-request', 'Метод запиту не підтримується')
    sendData(response, await action(await authenticate(request)), status)
  }
  catch (error) { sendError(response, mapError(error)) }
}

export async function jsonBody<T>(request: ApiRequest): Promise<T> {
  return readJson<T>(request)
}

export function mapError(error: unknown): unknown {
  if (error instanceof ApiError) return error
  if (error instanceof RecipeRepositoryError) {
    if (error.code === 'duplicate-name') return new ApiError(409, 'conflict', error.message)
    if (error.code === 'not-found') return new ApiError(404, 'not-found', error.message)
    if (error.code === 'invalid-product' || error.code === 'invalid-recipe') return new ApiError(422, 'validation', error.message)
  }
  if (error instanceof ProductRepositoryError) {
    if (error.code === 'duplicate-name' || error.code === 'base-unit-locked') return new ApiError(409, 'conflict', error.message)
    if (error.code === 'not-found') return new ApiError(404, 'not-found', error.message)
    return new ApiError(422, 'validation', error.message)
  }
  if (error instanceof MealPlanRepositoryError) {
    if (error.code === 'not-found') return new ApiError(404, 'not-found', error.message)
    if (error.code === 'duplicate-slot') return new ApiError(409, 'conflict', error.message)
    return new ApiError(422, 'validation', error.message)
  }
  return error
}

export function requireRecord(value: unknown, message = 'Некоректне тіло запиту'): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new ApiError(400, 'bad-request', message)
  return value as Record<string, unknown>
}

export function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new ApiError(400, 'bad-request', `Поле ${field} є обов’язковим`)
  return value
}
