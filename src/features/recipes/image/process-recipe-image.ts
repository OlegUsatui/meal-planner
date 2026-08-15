import type { RecipeImageInput } from '../types'

const maxDimension = 1600
const maxBytes = 2 * 1024 * 1024
const outputAspectRatio = 4 / 3

export interface RecipeImageCrop {
  zoom: number
  offsetX: number
  offsetY: number
}

export interface RecipeCropRegion {
  sourceX: number
  sourceY: number
  width: number
  height: number
}

export async function processRecipeImage(file: File, crop: RecipeImageCrop = { zoom: 1, offsetX: 0, offsetY: 0 }): Promise<RecipeImageInput & { blob: Blob }> {
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

export function calculateRecipeCrop(sourceWidth: number, sourceHeight: number, crop: RecipeImageCrop = { zoom: 1, offsetX: 0, offsetY: 0 }): RecipeCropRegion {
  const sourceAspectRatio = sourceWidth / sourceHeight
  const zoom = clamp(crop.zoom, 1, 3)
  const width = (sourceAspectRatio >= outputAspectRatio ? sourceHeight * outputAspectRatio : sourceWidth) / zoom
  const height = (sourceAspectRatio >= outputAspectRatio ? sourceHeight : sourceWidth / outputAspectRatio) / zoom
  const maxOffsetX = Math.max(0, sourceWidth - width)
  const maxOffsetY = Math.max(0, sourceHeight - height)
  return {
    sourceX: (sourceWidth - width) / 2 + clamp(crop.offsetX, -1, 1) * maxOffsetX / 2,
    sourceY: (sourceHeight - height) / 2 + clamp(crop.offsetY, -1, 1) * maxOffsetY / 2,
    width,
    height,
  }
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
