import { expect, test } from '@playwright/test'

test('adds a recipe to the week, opens details, and removes it', async ({ page }) => {
  await page.goto('/plan')
  await expect(page.getByRole('heading', { name: 'План харчування' })).toBeVisible()
  await seedRecipe(page)
  await page.reload()

  const today = page.locator('.week-day.today')
  await today.locator('.empty-meal-slot').first().click()
  await page.getByRole('button', { name: /Тестова страва/ }).click()
  await page.getByLabel('Кількість порцій').fill('2')
  await page.getByRole('button', { name: 'Додати до плану' }).click()

  await page.getByRole('button', { name: 'Відкрити рецепт Тестова страва' }).click()
  const details = page.getByRole('dialog', { name: 'Тестова страва' })
  await expect(details.getByText('800 ккал')).toBeVisible()
  await expect(details.getByText('200 g')).toBeVisible()
  await details.getByRole('button', { name: 'Закрити' }).click()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Дії для Тестова страва' }).click()
  await page.getByRole('button', { name: 'Видалити' }).click()
  await expect(page.getByRole('button', { name: 'Відкрити рецепт Тестова страва' })).toHaveCount(0)
})

async function seedRecipe(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('meal-planner')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const transaction = database.transaction(['products', 'recipes', 'recipeIngredients', 'imageAssets'], 'readwrite')
    const now = new Date().toISOString()
    transaction.objectStore('products').put({ id: 'e2e-product', name: 'Рис E2E', normalizedName: 'рис e2e', category: 'Крупи', baseUnit: 'g', archivedAt: null, createdAt: now, updatedAt: now })
    transaction.objectStore('imageAssets').put({ id: 'e2e-image', blob: new Blob(['image'], { type: 'image/webp' }), mimeType: 'image/webp', width: 100, height: 100, byteSize: 5, createdAt: now })
    transaction.objectStore('recipes').put({ id: 'e2e-recipe', name: 'Тестова страва', normalizedName: 'тестова страва', imageAssetId: 'e2e-image', instructions: 'Змішати та подати.', caloriesPerServing: 400, proteinGramsPerServing: 20, fatGramsPerServing: 10, carbsGramsPerServing: 60, preparationTimeMinMinutes: 20, preparationTimeMaxMinutes: 20, classifications: [{ mealType: 'breakfast', subcategoryId: 'breakfast-eggs' }], archivedAt: null, createdAt: now, updatedAt: now })
    transaction.objectStore('recipeIngredients').put({ id: 'e2e-ingredient', recipeId: 'e2e-recipe', productId: 'e2e-product', quantityBase: 100, enteredQuantity: 100, enteredUnit: 'g' })
    await new Promise<void>((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error) })
    database.close()
  })
}
