export type ImageUploadMode = 'create' | 'update'

export function isOwnedRecipeImagePath(userId: string, recipeId: string, path: string, mode: ImageUploadMode): boolean {
  const escapedUser = escapeRegExp(userId)
  const escapedRecipe = escapeRegExp(recipeId)
  const pattern = mode === 'create'
    ? new RegExp(`^${escapedUser}/${escapedRecipe}\\.webp$`, 'u')
    : new RegExp(`^${escapedUser}/${escapedRecipe}-\\d+\\.webp$`, 'u')
  return pattern.test(path)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}
