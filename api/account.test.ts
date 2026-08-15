import { describe, expect, it } from 'vitest'
import { assertFreshJwt } from './account'

describe('account deletion JWT guard', () => {
  it('accepts a recently issued JWT and rejects a stale one', () => {
    expect(() => assertFreshJwt(jwt({ iat: 1_000 }), 1_100)).not.toThrow()
    expect(() => assertFreshJwt(jwt({ iat: 1_000 }), 1_301)).toThrow(/Повторно увійдіть/)
  })
})

function jwt(payload: object): string { return `x.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.x` }
