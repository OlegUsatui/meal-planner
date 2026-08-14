import { describe, expect, it } from 'vitest'
import { isSystemImagePath, publicImageUrl, readR2Config } from './r2'

describe('R2 image storage', () => {
  it('reads required configuration and normalizes the public base URL', () => {
    expect(readR2Config({ R2_ACCOUNT_ID: 'account', R2_ACCESS_KEY_ID: 'key', R2_SECRET_ACCESS_KEY: 'secret', R2_BUCKET_NAME: 'meal-images', R2_PUBLIC_BASE_URL: 'https://cdn.example.com/' })).toEqual({ accountId: 'account', accessKeyId: 'key', secretAccessKey: 'secret', bucketName: 'meal-images', publicBaseUrl: 'https://cdn.example.com' })
  })

  it('builds stable public URLs for system images and keeps user paths private', () => {
    expect(isSystemImagePath('system/seed-lunch-1.webp')).toBe(true)
    expect(isSystemImagePath('user-1/recipe-1.webp')).toBe(false)
    expect(publicImageUrl('https://cdn.example.com', 'system/seed lunch.webp')).toBe('https://cdn.example.com/system/seed%20lunch.webp')
  })
})
