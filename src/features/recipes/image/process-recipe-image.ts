import type { RecipeImageInput } from '../types'

const maxDimension = 1600
const maxBytes = 2 * 1024 * 1024

export async function processRecipeImage(file: File): Promise<RecipeImageInput & { blob: Blob }> {
  if (!file.type.startsWith('image/')) throw new Error('Оберіть файл зображення')
  const source = await decodeImage(file)
  const ratio = Math.min(1, maxDimension / Math.max(source.width, source.height))
  const width = Math.max(1, Math.round(source.width * ratio))
  const height = Math.max(1, Math.round(source.height * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')?.drawImage(source, 0, 0, width, height)
  if ('close' in source) source.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82))
  if (!blob || blob.size > maxBytes) throw new Error('Фото не вдалося стиснути до 2 MB')
  return { blob, mimeType: 'image/webp', width, height, byteSize: blob.size }
}

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
