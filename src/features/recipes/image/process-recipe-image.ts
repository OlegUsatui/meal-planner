import type { RecipeImageInput } from '../types'

const maxDimension = 1600
const maxBytes = 2 * 1024 * 1024
const outputAspectRatio = 4 / 3

export interface RecipeImageCrop {
  x: number
  y: number
  width: number
  height: number
}

export type RecipeCropHandle = 'nw' | 'ne' | 'sw' | 'se'

export interface RecipeCropRegion {
  sourceX: number
  sourceY: number
  width: number
  height: number
}

export async function processRecipeImage(file: File, crop?: RecipeImageCrop): Promise<RecipeImageInput & { blob: Blob }> {
  if (!file.type.startsWith('image/')) throw new Error('Оберіть файл зображення')
  const source = await decodeImage(file)
  const region = calculateRecipeCrop(source.width, source.height, crop)
  const ratio = Math.min(1, maxDimension / Math.max(region.width, region.height))
  const width = Math.max(1, Math.round(region.width * ratio))
  const height = Math.max(1, Math.round(region.height * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')?.drawImage(source, region.sourceX, region.sourceY, region.width, region.height, 0, 0, width, height)
  if ('close' in source) source.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82))
  if (!blob || blob.size > maxBytes) throw new Error('Фото не вдалося стиснути до 2 MB')
  return { blob, mimeType: 'image/webp', width, height, byteSize: blob.size }
}

export function createRecipeCrop(sourceWidth: number, sourceHeight: number): RecipeImageCrop {
  const sourceAspectRatio = sourceWidth / sourceHeight
  if (sourceAspectRatio >= outputAspectRatio) {
    const width = outputAspectRatio / sourceAspectRatio
    return { x: (1 - width) / 2, y: 0, width, height: 1 }
  }
  const height = sourceAspectRatio / outputAspectRatio
  return { x: 0, y: (1 - height) / 2, width: 1, height }
}

export function moveRecipeCrop(crop: RecipeImageCrop, deltaX: number, deltaY: number): RecipeImageCrop {
  return { ...crop, x: clamp(crop.x + deltaX, 0, 1 - crop.width), y: clamp(crop.y + deltaY, 0, 1 - crop.height) }
}

export function zoomRecipeCrop(crop: RecipeImageCrop, zoom: number, sourceWidth: number, sourceHeight: number): RecipeImageCrop {
  const base = createRecipeCrop(sourceWidth, sourceHeight)
  const normalizedZoom = clamp(zoom, 1, 3)
  const width = base.width / normalizedZoom
  const height = base.height / normalizedZoom
  const centerX = crop.x + crop.width / 2
  const centerY = crop.y + crop.height / 2
  return { x: clamp(centerX - width / 2, 0, 1 - width), y: clamp(centerY - height / 2, 0, 1 - height), width, height }
}

export function resizeRecipeCrop(crop: RecipeImageCrop, handle: RecipeCropHandle, pointerX: number, pointerY: number, sourceWidth: number, sourceHeight: number): RecipeImageCrop {
  const fromLeft = handle === 'nw' || handle === 'sw'
  const fromTop = handle === 'nw' || handle === 'ne'
  const anchorX = fromLeft ? crop.x + crop.width : crop.x
  const anchorY = fromTop ? crop.y + crop.height : crop.y
  const horizontalWidth = Math.abs(pointerX - anchorX)
  const verticalWidth = Math.abs(pointerY - anchorY) * sourceHeight * outputAspectRatio / sourceWidth
  const base = createRecipeCrop(sourceWidth, sourceHeight)
  const minWidth = Math.min(base.width, Math.max(80 / sourceWidth, base.width / 20))
  const maxHorizontal = fromLeft ? anchorX : 1 - anchorX
  const maxVertical = (fromTop ? anchorY : 1 - anchorY) * sourceHeight * outputAspectRatio / sourceWidth
  const width = clamp(Math.min(horizontalWidth, verticalWidth), minWidth, Math.min(maxHorizontal, maxVertical, base.width))
  const height = width * sourceWidth / sourceHeight / outputAspectRatio
  return { x: fromLeft ? anchorX - width : anchorX, y: fromTop ? anchorY - height : anchorY, width, height }
}

export function calculateRecipeCrop(sourceWidth: number, sourceHeight: number, crop: RecipeImageCrop = createRecipeCrop(sourceWidth, sourceHeight)): RecipeCropRegion {
  const normalized = constrainRecipeCrop(crop, sourceWidth, sourceHeight)
  return {
    sourceX: normalized.x * sourceWidth,
    sourceY: normalized.y * sourceHeight,
    width: normalized.width * sourceWidth,
    height: normalized.height * sourceHeight,
  }
}

function constrainRecipeCrop(crop: RecipeImageCrop, sourceWidth: number, sourceHeight: number): RecipeImageCrop {
  const base = createRecipeCrop(sourceWidth, sourceHeight)
  const width = clamp(crop.width, Math.max(1 / sourceWidth, base.width / 100), base.width)
  const height = width * sourceWidth / sourceHeight / outputAspectRatio
  if (height > 1) return base
  return { x: clamp(crop.x, 0, 1 - width), y: clamp(crop.y, 0, 1 - height), width, height }
}

export function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)) }

export function imageFileFromClipboard(clipboard: DataTransfer): File | undefined {
  for (const item of Array.from(clipboard.items)) {
    if (item.kind !== 'file' || !item.type.startsWith('image/')) continue
    const file = item.getAsFile()
    if (file) return file
  }
  return undefined
}

async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(file) } catch { /* fall back to image-element decoding */ }
  }
  const url = URL.createObjectURL(file)
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Не вдалося прочитати фото'))
      image.src = url
    })
  } finally { URL.revokeObjectURL(url) }
}
