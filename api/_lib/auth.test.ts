import { describe, expect, it } from 'vitest'
import { bearerToken } from './auth'

describe('auth middleware', () => {
  it('requires a bearer token', () => {
    expect(() => bearerToken({ headers: {} })).toThrowError(/авторизація/u)
  })

  it('extracts a bearer token', () => {
    expect(bearerToken({ headers: { authorization: 'Bearer access-token' } })).toBe('access-token')
  })
})
