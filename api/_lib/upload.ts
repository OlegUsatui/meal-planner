import { isOwnedRecipeImagePath, type ImageUploadMode } from '../../src/supabase/image-path.js'
import { ApiError } from './http.js'

export function assertUploadPath(userId: string, recipeId: string, path: string, mode: ImageUploadMode): void {
  if (!isOwnedRecipeImagePath(userId, recipeId, path, mode)) throw new ApiError(403, 'forbidden', 'Шлях фото не належить поточному користувачу')
}
