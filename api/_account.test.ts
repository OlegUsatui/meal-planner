import { describe, expect, it } from 'vitest'
import { assertFreshJwt } from './account'

describe('account deletion JWT guard', () => {
  it('accepts a recently issued JWT and rejects a stale one', () => {
    expect(() => assertFreshJwt(jwt({ iat: 1_000 }), 1_100)).not.toThrow()
    expect(() => assertFreshJwt(jwt({ iat: 1_000 }), 1_301)).toThrow(/Повторно увійдіть/)
  })
})

function jwt(payload: { iat: number }): string { return `x.${encodeBase64Url(JSON.stringify(payload))}.x` }

function encodeBase64Url(value: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const bytes = new TextEncoder().encode(value)
  let result = ''
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0
    const second = bytes[index + 1]
    const third = bytes[index + 2]
    result += alphabet[first >> 2]
    result += alphabet[((first & 3) << 4) | ((second ?? 0) >> 4)]
    if (second === undefined) result += '=='
    else {
      result += alphabet[((second & 15) << 2) | ((third ?? 0) >> 6)]
      result += third === undefined ? '=' : alphabet[third & 63]
    }
  }
  return result.replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/u, '')
}
