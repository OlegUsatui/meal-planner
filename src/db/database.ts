import Dexie, { type EntityTable } from 'dexie'
import type {
  AppSettingsRecord,
  ImageAssetRecord,
  MealPlanEntryRecord,
  ProductRecord,
  RecipeIngredientRecord,
  RecipeRecord,
} from './records'

export class MealPlannerDatabase extends Dexie {
  products!: EntityTable<ProductRecord, 'id'>
  recipes!: EntityTable<RecipeRecord, 'id'>
  recipeIngredients!: EntityTable<RecipeIngredientRecord, 'id'>
  mealPlanEntries!: EntityTable<MealPlanEntryRecord, 'id'>
  imageAssets!: EntityTable<ImageAssetRecord, 'id'>
  appSettings!: EntityTable<AppSettingsRecord, 'id'>

  constructor(name = 'meal-planner') {
    super(name)
    this.version(1).stores({
      products: '&id, normalizedName, category, archivedAt, updatedAt',
      recipes: '&id, normalizedName, archivedAt, updatedAt, imageAssetId',
      recipeIngredients: '&id, recipeId, productId, &[recipeId+productId]',
      mealPlanEntries:
        '&id, &dateSlot, date, recipeId, status, planRevision',
      inventoryTransactions:
        '&id, productId, type, occurredAt, mealPlanEntryId, shoppingListItemId, &deduplicationKey',
      planMutations: '&revision, affectedDate, cause, occurredAt',
      shoppingLists:
        '&id, status, createdAt, rangeEnd, sourcePlanRevision',
      shoppingListItems:
        '&id, shoppingListId, productId, status, [shoppingListId+status]',
      imageAssets: '&id, createdAt',
      appSettings: '&id',
    })
    this.version(2).stores({
      products: '&id, normalizedName, category, archivedAt, updatedAt',
      recipes: '&id, normalizedName, archivedAt, updatedAt, imageAssetId',
      recipeIngredients: '&id, recipeId, productId, &[recipeId+productId]',
      mealPlanEntries: '&id, &dateSlot, date, recipeId',
      imageAssets: '&id, createdAt',
      appSettings: '&id',
      inventoryTransactions: null,
      planMutations: null,
      shoppingLists: null,
      shoppingListItems: null,
    }).upgrade((transaction) => transaction.table('products').toCollection().modify((record) => {
      delete record.packageQuantityBase
      delete record.currentPriceOre
    }).then(() => transaction.table('mealPlanEntries').toCollection().modify((record) => {
      delete record.status
      delete record.cookedAt
      delete record.planRevision
    })))
    this.version(3).stores({
      products: '&id, normalizedName, category, archivedAt, updatedAt',
      recipes: '&id, normalizedName, archivedAt, updatedAt, imageAssetId',
      recipeIngredients: '&id, recipeId, productId, &[recipeId+productId]',
      mealPlanEntries: '&id, &dateSlot, date, recipeId',
      imageAssets: '&id, createdAt',
      appSettings: '&id',
    }).upgrade((transaction) => transaction.table('recipes').toCollection().modify((record) => {
      delete record.baseServings
      record.caloriesPerServing ??= null
      record.proteinGramsPerServing ??= null
      record.fatGramsPerServing ??= null
      record.carbsGramsPerServing ??= null
      record.preparationTimeMinutes ??= null
    }))
    this.version(4).stores({
      products: '&id, normalizedName, category, archivedAt, updatedAt',
      recipes: '&id, normalizedName, archivedAt, updatedAt, imageAssetId',
      recipeIngredients: '&id, recipeId, productId, &[recipeId+productId]',
      mealPlanEntries: '&id, &dateSlot, date, recipeId',
      imageAssets: '&id, createdAt',
      appSettings: '&id',
    }).upgrade((transaction) => transaction.table('recipes').toCollection().modify((record) => {
      record.classifications ??= []
    }))
    this.version(5).stores({
      products: '&id, normalizedName, category, archivedAt, updatedAt',
      recipes: '&id, normalizedName, archivedAt, updatedAt, imageAssetId',
      recipeIngredients: '&id, recipeId, productId, &[recipeId+productId]',
      mealPlanEntries: '&id, &dateSlot, date, recipeId',
      imageAssets: '&id, createdAt',
      appSettings: '&id',
    }).upgrade((transaction) => transaction.table('recipes').toCollection().modify((record) => {
      const legacyTime = record.preparationTimeMinutes ?? null
      record.preparationTimeMinMinutes = legacyTime
      record.preparationTimeMaxMinutes = legacyTime
      delete record.preparationTimeMinutes
    }))
    this.version(6).stores({
      products: '&id, normalizedName, category, archivedAt, updatedAt',
      recipes: '&id, normalizedName, archivedAt, updatedAt, imageAssetId',
      recipeIngredients: '&id, recipeId, productId, &[recipeId+productId]',
      mealPlanEntries: '&id, &dateSlot, date, recipeId',
      imageAssets: '&id, createdAt',
      appSettings: '&id',
    }).upgrade((transaction) => transaction.table('recipes').toCollection().modify((record) => {
      record.imageAssetId ??= null
    }))
  }
}

export const database = new MealPlannerDatabase()
