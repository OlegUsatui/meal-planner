import { describe, expect, it } from 'vitest'
import { imageFileFromClipboard } from './process-recipe-image'

describe('imageFileFromClipboard', () => {
  it('returns the first image item and ignores text', () => {
    const image = new File(['png'], 'screenshot.png', { type: 'image/png' })
    const clipboard = {
      items: [
        { kind: 'string', type: 'text/plain', getAsFile: () => null },
        { kind: 'file', type: 'image/png', getAsFile: () => image },
      ],
    } as unknown as DataTransfer
    expect(imageFileFromClipboard(clipboard)).toBe(image)
  })
})
