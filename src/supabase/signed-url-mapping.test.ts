import { describe, expect, it } from 'vitest'
import { mapSignedUrls } from './signed-url-mapping'

describe('mapSignedUrls', () => {
  it('maps batch responses by path and keeps failed images empty', () => {
    expect(mapSignedUrls(['a.webp', 'b.webp', 'c.webp'], [
      { path: 'b.webp', signedUrl: 'https://signed/b', error: null },
      { path: 'a.webp', signedUrl: null, error: 'not found' },
    ])).toEqual(new Map([['a.webp', ''], ['b.webp', 'https://signed/b'], ['c.webp', '']]))
  })

  it('returns an empty map for a failed batch request', () => {
    expect(mapSignedUrls(['a.webp'], null)).toEqual(new Map([['a.webp', '']]))
  })

  it('supports the full seeded catalogue in one mapping pass', () => {
    const paths = Array.from({ length: 457 }, (_, index) => `user/recipe-${index}.webp`)
    const result = mapSignedUrls(paths, paths.map((path) => ({ path, signedUrl: `https://signed/${path}`, error: null })))
    expect(result.size).toBe(457)
    expect(result.get(paths[456])).toContain('recipe-456')
  })
})
