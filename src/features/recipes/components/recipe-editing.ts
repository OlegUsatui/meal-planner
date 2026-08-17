import type { Recipe, UpdateRecipeInput } from '../types'

export type RecipeEditBlock = 'hero' | 'nutrition' | 'ingredients' | 'instructions'
export type RecipeBlockPatch = Partial<UpdateRecipeInput>

export function recipeInput(recipe: Recipe): Omit<UpdateRecipeInput, 'image'> {
  return {
    name: recipe.name,
    instructions: recipe.instructions,
    ingredients: recipe.ingredients.map(({ productId, enteredQuantity, enteredUnit }) => ({ productId, enteredQuantity, enteredUnit })),
    classifications: recipe.classifications,
    caloriesPerServing: recipe.caloriesPerServing,
    proteinGramsPerServing: recipe.proteinGramsPerServing,
    fatGramsPerServing: recipe.fatGramsPerServing,
    carbsGramsPerServing: recipe.carbsGramsPerServing,
    preparationTimeMinMinutes: recipe.preparationTimeMinMinutes,
    preparationTimeMaxMinutes: recipe.preparationTimeMaxMinutes,
  }
}

export function optionalNumber(value: string): number | null {
  return value.trim() ? Number(value.replace(',', '.')) : null
}

export function recipeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Не вдалося зберегти зміни'
}
