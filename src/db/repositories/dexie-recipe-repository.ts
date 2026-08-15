import type { MealPlannerDatabase } from '../database'
import { hasRecipeValidationErrors, normalizeRecipeName, validateRecipeInput } from '../../features/recipes/domain/recipe'
import { normalizeQuantity } from '../../features/products/domain/product'
import { RecipeRepositoryError, type RecipeRepository } from '../../features/recipes/repositories/recipe-repository'
import type { CreateRecipeInput, Recipe, RecipeImageInput, RecipeSummary, UpdateRecipeInput } from '../../features/recipes/types'
import { uniqueClassifications } from '../../features/recipes/domain/recipe-taxonomy'

type Runtime = { now: () => string; id: () => string }
const defaultRuntime: Runtime = { now: () => new Date().toISOString(), id: () => crypto.randomUUID() }

export class DexieRecipeRepository implements RecipeRepository {
  private readonly database: MealPlannerDatabase
  private readonly runtime: Runtime

  constructor(database: MealPlannerDatabase, runtime: Runtime = defaultRuntime) {
    this.database = database
    this.runtime = runtime
  }

  async list(query = ''): Promise<RecipeSummary[]> {
    const normalizedQuery = normalizeRecipeName(query)
    const records = (await this.database.recipes.toArray())
      .filter((recipe) => !recipe.archivedAt && (!normalizedQuery || recipe.normalizedName.includes(normalizedQuery)))
      .sort((left, right) => left.name.localeCompare(right.name, 'uk-UA', { sensitivity: 'base' }))
    const recipes = await Promise.all(records.map((record) => this.toRecipe(record.id)))
    return recipes.map(toSummary)
  }

  async get(id: string): Promise<Recipe> { return this.toRecipe(id) }

  async create(input: CreateRecipeInput): Promise<Recipe> {
    const recipeId = this.runtime.id()
    await this.database.transaction('rw', this.database.recipes, this.database.recipeIngredients, this.database.imageAssets, this.database.products, async () => {
      const ingredients = await this.prepareIngredients(input)
      const now = this.runtime.now()
      const imageAssetId = input.image ? this.runtime.id() : null
      if (input.image && imageAssetId) { assertImage(input.image); await this.database.imageAssets.add({ id: imageAssetId, ...input.image, createdAt: now }) }
      await this.database.recipes.add({ id: recipeId, name: cleanName(input.name), normalizedName: normalizeRecipeName(input.name), imageAssetId, instructions: input.instructions.trim(), caloriesPerServing: input.caloriesPerServing, proteinGramsPerServing: input.proteinGramsPerServing, fatGramsPerServing: input.fatGramsPerServing, carbsGramsPerServing: input.carbsGramsPerServing, preparationTimeMinMinutes: input.preparationTimeMinMinutes, preparationTimeMaxMinutes: input.preparationTimeMaxMinutes, classifications: uniqueClassifications(input.classifications), archivedAt: null, createdAt: now, updatedAt: now })
      await this.database.recipeIngredients.bulkAdd(ingredients.map((ingredient) => ({ id: this.runtime.id(), recipeId, ...ingredient })))
    })
    return this.get(recipeId)
  }

  async update(id: string, input: UpdateRecipeInput): Promise<Recipe> {
    await this.database.transaction('rw', this.database.recipes, this.database.recipeIngredients, this.database.imageAssets, this.database.products, async () => {
      const current = await this.database.recipes.get(id)
      if (!current) throw new RecipeRepositoryError('not-found', 'Рецепт не знайдено')
      const ingredients = await this.prepareIngredients(input, id)
      const now = this.runtime.now()
      let imageAssetId = current.imageAssetId
      if (input.image === null) imageAssetId = null
      else if (input.image) {
        assertImage(input.image)
        imageAssetId = this.runtime.id()
        await this.database.imageAssets.add({ id: imageAssetId, ...input.image, createdAt: now })
      }
      await this.database.recipes.update(id, { name: cleanName(input.name), normalizedName: normalizeRecipeName(input.name), imageAssetId, instructions: input.instructions.trim(), caloriesPerServing: input.caloriesPerServing, proteinGramsPerServing: input.proteinGramsPerServing, fatGramsPerServing: input.fatGramsPerServing, carbsGramsPerServing: input.carbsGramsPerServing, preparationTimeMinMinutes: input.preparationTimeMinMinutes, preparationTimeMaxMinutes: input.preparationTimeMaxMinutes, classifications: uniqueClassifications(input.classifications), updatedAt: now })
      await this.database.recipeIngredients.where({ recipeId: id }).delete()
      await this.database.recipeIngredients.bulkAdd(ingredients.map((ingredient) => ({ id: this.runtime.id(), recipeId: id, ...ingredient })))
      if (input.image !== undefined && current.imageAssetId) await this.database.imageAssets.delete(current.imageAssetId)
    })
    return this.get(id)
  }

  async archive(id: string): Promise<void> {
    const changed = await this.database.recipes.update(id, { archivedAt: this.runtime.now(), updatedAt: this.runtime.now() })
    if (!changed) throw new RecipeRepositoryError('not-found', 'Рецепт не знайдено')
  }

  private async prepareIngredients(input: Omit<CreateRecipeInput, 'image'> | UpdateRecipeInput, exceptId?: string) {
    if (hasRecipeValidationErrors(validateRecipeInput(input))) throw new RecipeRepositoryError('invalid-recipe', 'Некоректний рецепт')
    const normalizedName = normalizeRecipeName(input.name)
    const duplicate = await this.database.recipes.where('normalizedName').equals(normalizedName).first()
    if (duplicate && duplicate.id !== exceptId && !duplicate.archivedAt) throw new RecipeRepositoryError('duplicate-name', 'Рецепт із такою назвою вже існує')
    const products = await Promise.all(input.ingredients.map((ingredient) => this.database.products.get(ingredient.productId)))
    if (products.some((product) => !product || product.archivedAt)) throw new RecipeRepositoryError('invalid-product', 'Оберіть активний продукт')
    try {
      return input.ingredients.map((ingredient, index) => ({ productId: ingredient.productId, quantityBase: normalizeQuantity(ingredient.enteredQuantity, ingredient.enteredUnit, products[index]!.baseUnit), enteredQuantity: ingredient.enteredQuantity, enteredUnit: ingredient.enteredUnit }))
    } catch { throw new RecipeRepositoryError('invalid-product', 'Кількість або одиниця продукту несумісні') }
  }

  private async toRecipe(id: string): Promise<Recipe> {
    const record = await this.database.recipes.get(id)
    if (!record) throw new RecipeRepositoryError('not-found', 'Рецепт не знайдено')
    const [image, ingredientRecords] = await Promise.all([record.imageAssetId ? this.database.imageAssets.get(record.imageAssetId) : undefined, this.database.recipeIngredients.where({ recipeId: id }).toArray()])
    const ingredients = await Promise.all(ingredientRecords.map(async (ingredient) => {
      const product = await this.database.products.get(ingredient.productId)
      if (!product) throw new RecipeRepositoryError('invalid-product', 'Продукт рецепту не знайдено')
      return { ...ingredient, productName: product.name, productBaseUnit: product.baseUnit }
    }))
    return { ...record, classifications: record.classifications ?? [], image: image ? imageToInput(image) : null, ingredients, ownerId: null, isSystem: false }
  }
}

function toSummary(recipe: Recipe): RecipeSummary {
  const { normalizedName: _normalizedName, instructions: _instructions, caloriesPerServing: _calories, proteinGramsPerServing: _protein, fatGramsPerServing: _fat, carbsGramsPerServing: _carbs, createdAt: _createdAt, updatedAt: _updatedAt, ingredients: _ingredients, ...summary } = recipe
  return summary
}

function cleanName(name: string) { return name.trim().replace(/\s+/gu, ' ') }
function imageToInput(image: { blob: Blob; mimeType: string; width: number; height: number; byteSize: number }): RecipeImageInput { return image }
function assertImage(image: RecipeImageInput): asserts image is RecipeImageInput & { blob: Blob } {
  if (!image.blob || !image.mimeType.startsWith('image/') || image.width < 1 || image.height < 1 || image.byteSize < 1 || image.byteSize > 2 * 1024 * 1024) throw new RecipeRepositoryError('invalid-recipe', 'Некоректне фото рецепту')
}
