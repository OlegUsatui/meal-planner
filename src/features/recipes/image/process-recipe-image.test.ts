import { describe, expect, it } from 'vitest'
import { calculateRecipeCrop, createRecipeCrop, imageFileFromClipboard, moveRecipeCrop, resizeRecipeCrop, zoomRecipeCrop } from './process-recipe-image'

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
    const crop = zoomRecipeCrop(createRecipeCrop(1200, 2400), 3, 1200, 2400)
    const moved = moveRecipeCrop(crop, -2, 2)
    const region = calculateRecipeCrop(1200, 2400, moved)
    expect(region.width / region.height).toBeCloseTo(4 / 3)
    expect(region.sourceX).toBeGreaterThanOrEqual(0)
    expect(region.sourceY + region.height).toBeLessThanOrEqual(2400)
  })

  it('creates the largest centered 4:3 selection inside the source image', () => {
    const landscape = createRecipeCrop(2400, 1600)
    expect(landscape.x).toBeCloseTo(1 / 18)
    expect(landscape).toMatchObject({ y: 0, width: 8 / 9, height: 1 })
    expect(createRecipeCrop(1200, 1600)).toEqual({ x: 0, y: 7 / 32, width: 1, height: 9 / 16 })
  })

  it('resizes from a corner while preserving the final 4:3 ratio', () => {
    const crop = resizeRecipeCrop(createRecipeCrop(1600, 1200), 'se', 0.5, 0.5, 1600, 1200)
    const region = calculateRecipeCrop(1600, 1200, crop)
    expect(crop).toEqual({ x: 0, y: 0, width: 0.5, height: 0.5 })
    expect(region.width / region.height).toBeCloseTo(4 / 3)
  })

  it('keeps moved and zoomed selections within the image', () => {
    const initial = createRecipeCrop(1600, 1200)
    const zoomed = zoomRecipeCrop(initial, 2, 1600, 1200)
    expect(moveRecipeCrop(zoomed, 2, 2)).toEqual({ x: 0.5, y: 0.5, width: 0.5, height: 0.5 })
  })
})
