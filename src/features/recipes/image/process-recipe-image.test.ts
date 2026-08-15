import { describe, expect, it } from 'vitest'
import { calculateRecipeCrop, imageFileFromClipboard } from './process-recipe-image'

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

  it('calculates a centered 4:3 crop and keeps the crop within the source', () => {
    const region = calculateRecipeCrop(2400, 1600)
    expect(region.width / region.height).toBeCloseTo(4 / 3)
    expect(region.sourceX).toBeCloseTo(133.333, 2)
    expect(region.sourceY).toBeCloseTo(0)
  })

  it('applies zoom and clamps the requested position', () => {
    const region = calculateRecipeCrop(1200, 2400, { zoom: 4, offsetX: -2, offsetY: 2 })
    expect(region.width / region.height).toBeCloseTo(4 / 3)
    expect(region.sourceX).toBeGreaterThanOrEqual(0)
    expect(region.sourceY + region.height).toBeLessThanOrEqual(2400)
  })
})
