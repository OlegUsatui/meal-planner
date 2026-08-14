import { expect, test } from '@playwright/test'

const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

test.skip(!email || !password, 'Set E2E_EMAIL and E2E_PASSWORD for the authenticated REST API smoke flow')

test('login, browse data, create a recipe with a photo, and use the plan and shopping list', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Email').fill(email!)
  await page.getByLabel('Пароль').fill(password!)
  await page.getByRole('button', { name: 'Увійти' }).click()

  await expect(page.getByRole('heading', { name: 'План харчування' })).toBeVisible()
  await page.getByRole('link', { name: 'Рецепти' }).click()
  await expect(page.getByRole('heading', { name: 'Рецепти' })).toBeVisible()
  await page.getByRole('link', { name: 'Продукти' }).click()
  await expect(page.getByRole('heading', { name: 'Продукти' })).toBeVisible()

  await page.getByRole('link', { name: '+ Новий рецепт' }).first().click()
  const name = `E2E рецепт ${Date.now()}`
  await page.getByLabel('Назва рецепту').fill(name)
  await page.locator('.classification-option input').first().check()
  await page.getByLabel('Фото рецепту').setInputFiles({ name: 'recipe.webp', mimeType: 'image/webp', buffer: WEBP_1X1 })
  await page.getByLabel('Продукт').selectOption({ index: 1 })
  await page.getByLabel('Кількість').fill('100')
  await page.getByLabel('Спосіб приготування').fill('Змішати та подати.')
  await page.getByRole('button', { name: 'Зберегти рецепт' }).click()
  await expect(page).toHaveURL(/\/recipes$/)
  await expect(page.getByRole('heading', { name })).toBeVisible()

  await page.getByRole('link', { name: 'План' }).click()
  const today = page.locator('.week-day.today')
  await today.locator('.empty-meal-slot').first().click()
  await page.getByRole('button', { name: new RegExp(name) }).click()
  await page.getByLabel('Кількість порцій').fill('2')
  await page.getByRole('button', { name: 'Додати до плану' }).click()
  await expect(page.getByRole('button', { name: new RegExp(`Відкрити рецепт ${name}`) })).toBeVisible()

  await page.getByRole('link', { name: 'Покупки' }).click()
  await expect(page.getByRole('heading', { name: 'Покупки' })).toBeVisible()
})

const WEBP_1X1 = Buffer.from('UklGRiIAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEALAsAAQ0JaQAA3AA/vuUAAA==', 'base64')
