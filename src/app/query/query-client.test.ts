import { describe, expect, it } from 'vitest'
import { ApiClientError } from '../../api/api-client'
import { cacheTimes, createSessionQueryClient, queryKeys } from './query-client'

describe('session query cache', () => {
  it('uses stable user-partitioned query keys', () => {
    expect(queryKeys.recipes('user-1', { query: 'суп', page: 2 })).toEqual(['recipes', 'user-1', { page: 2, query: 'суп' }])
    expect(queryKeys.mealPlan('user-1', '2026-08-10', '2026-08-16')).toEqual(['meal-plan', 'user-1', '2026-08-10', '2026-08-16'])
    expect(queryKeys.shoppingList('user-1', '2026-08-10', undefined)).toEqual(['shopping-list', 'user-1', '2026-08-10', 'all'])
  })

  it('keeps session data for thirty minutes and retries only one network/server failure', () => {
    const client = createSessionQueryClient()
    const defaults = client.getDefaultOptions().queries!
    const retry = defaults.retry as (failureCount: number, error: Error) => boolean

    expect(defaults.gcTime).toBe(cacheTimes.sessionGc)
    expect(retry(0, new ApiClientError(503, 'internal', 'server'))).toBe(true)
    expect(retry(1, new ApiClientError(503, 'internal', 'server'))).toBe(false)
    expect(retry(0, new ApiClientError(422, 'validation', 'invalid'))).toBe(false)
    expect(retry(0, new TypeError('Failed to fetch'))).toBe(true)
    expect(retry(0, new Error('domain error'))).toBe(false)
  })

  it('removes every user partition when the session cache is cleared', () => {
    const client = createSessionQueryClient()
    client.setQueryData(queryKeys.recipes('user-1'), [{ id: 'private-1' }])

    client.clear()

    expect(client.getQueryData(queryKeys.recipes('user-1'))).toBeUndefined()
  })
})
