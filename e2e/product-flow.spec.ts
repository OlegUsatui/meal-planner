import { expect, test } from '@playwright/test'

test('creates a product and keeps it after reload', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: 'Створити продукт' }).first().click()
  await page.getByLabel('Назва продукту').fill('Рис жасмин')
  await page.getByLabel('Категорія').selectOption('Крупи')
  await page.getByLabel('Базова одиниця').selectOption('g')
  await page.getByRole('button', { name: 'Створити продукт' }).click()

  await expect(page).toHaveURL(/\/products$/)
  await expect(
    page.locator('.product-table strong:visible, .product-card h2:visible').filter({ hasText: /^Рис жасмин$/ }),
  ).toBeVisible()
  await expect(page.locator('.product-table td:visible, .product-card dd:visible').filter({ hasText: 'g' }).first()).toBeVisible()

  await page.reload()
  await expect(
    page.locator('.product-table strong:visible, .product-card h2:visible').filter({ hasText: /^Рис жасмин$/ }),
  ).toBeVisible()
  await expect(page.locator('.product-table td:visible, .product-card dd:visible').filter({ hasText: 'g' }).first()).toBeVisible()
})

test('bootstraps products from the workbook catalogue', async ({ page }) => {
  await page.goto('/products')

  await expect(
    page.locator('.product-table strong:visible, .product-card h2:visible').filter({ hasText: /^Куряче філе$/ }),
  ).toBeVisible()
  await expect(
    page.locator('.product-table strong:visible, .product-card h2:visible').filter({ hasText: /^Buldak Carbonara$/ }),
  ).toBeVisible()
})

test('bootstraps every validated recipe from all three PDF sources', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/recipes')
  await expect(page.locator('.recipe-card')).toHaveCount(457, { timeout: 90_000 })
  await expect(page.getByRole('tab', { name: 'Сніданок' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Вечеря' })).toBeVisible()
  const products = await page.evaluate(() => new Promise<Array<{ name: string; category: string }>>((resolve, reject) => {
    const request = indexedDB.open('meal-planner')
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const read = request.result.transaction('products', 'readonly').objectStore('products').getAll()
      read.onerror = () => reject(read.error)
      read.onsuccess = () => resolve(read.result as Array<{ name: string; category: string }>)
    }
  }))
  expect(products.some((product) => product.category === 'Імпортовані обіди')).toBe(false)
  expect(products.some((product) => /a60|ч\.\s*л\.|слайд|[@|Э]/iu.test(product.name))).toBe(false)
})

test('repairs an existing imported OCR title without replacing the recipe', async ({ page }) => {
  test.setTimeout(120_000)
  const corrected = 'Боул з гречкою, яйцем і авокадо'
  const broken = 'Боул з гречкою, яйцем авокадо a'
  await page.goto('/recipes')
  await expect(page.getByRole('heading', { name: corrected, exact: true })).toBeVisible({ timeout: 90_000 })
  const recipeId = await page.evaluate(async ({ corrected, broken }) => new Promise<string>((resolve, reject) => {
    const request = indexedDB.open('meal-planner')
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const transaction = request.result.transaction(['recipes', 'appSettings'], 'readwrite')
      const recipes = transaction.objectStore('recipes')
      const recipeRequest = recipes.index('normalizedName').get(corrected.toLocaleLowerCase('uk-UA'))
      const settingsRequest = transaction.objectStore('appSettings').get('app')
      let id = ''
      recipeRequest.onsuccess = () => {
        const recipe = recipeRequest.result
        id = recipe.id
        recipes.put({ ...recipe, name: broken, normalizedName: broken.toLocaleLowerCase('uk-UA') })
      }
      settingsRequest.onsuccess = () => {
        const settings = settingsRequest.result
        delete settings.recipeTitleRepairVersion
        transaction.objectStore('appSettings').put(settings)
      }
      transaction.onerror = () => reject(transaction.error)
      transaction.oncomplete = () => resolve(id)
    }
  }), { corrected, broken })

  await page.reload()
  await expect(page.getByRole('heading', { name: corrected, exact: true })).toBeVisible()
  const repairedId = await page.evaluate(async (name) => new Promise<string>((resolve, reject) => {
    const request = indexedDB.open('meal-planner')
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const get = request.result.transaction('recipes').objectStore('recipes').index('normalizedName').get(name.toLocaleLowerCase('uk-UA'))
      get.onerror = () => reject(get.error)
      get.onsuccess = () => resolve(get.result.id)
    }
  }), corrected)
  expect(repairedId).toBe(recipeId)
})
