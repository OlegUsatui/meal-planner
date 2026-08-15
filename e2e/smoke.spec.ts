import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

test.beforeAll(() => {
  if (!email || !password) throw new Error('E2E_EMAIL and E2E_PASSWORD are required; authenticated E2E must never be skipped')
})

test('authenticated mobile/desktop core flow has no serious accessibility violations', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Email').fill(email!)
  await page.getByLabel('Пароль').fill(password!)
  await page.getByRole('button', { name: 'Увійти' }).click()

  const welcome = page.getByRole('heading', { name: 'Почнімо з однієї смачної страви' })
  if (await welcome.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Запланувати першу страву' }).click()
    await page.getByLabel('Прийом їжі').selectOption('dinner')
    await page.getByRole('button', { name: 'Обрати рецепт' }).click()
    await page.locator('.picker-recipe').first().click()
    await page.getByRole('button', { name: 'Додати до плану' }).click()
    await expect(page.getByRole('heading', { name: 'Перша страва у плані' })).toBeVisible()
    await page.getByRole('button', { name: /Перейти до Сьогодні/ }).click()
  }
  await expect(page.getByRole('heading', { name: 'Сьогодні' })).toBeVisible()
  await expectNoSeriousAxe(page)

  await page.goto('/recipes/new')
  const name = `E2E рецепт ${Date.now()}`
  await page.getByLabel(/Назва рецепту/).fill(name)
  await page.getByRole('button', { name: 'Вечеря' }).click()
  await page.getByLabel('Повноцінна тарілка').check()
  await page.getByLabel('Продукт').selectOption({ index: 1 })
  await page.getByLabel('Кількість').fill('100')
  await page.getByLabel(/Спосіб приготування/).fill('Змішати та подати.')
  await page.getByRole('button', { name: 'Зберегти рецепт' }).click()
  await expect(page).toHaveURL(/\/recipes\/[^/]+\?created=1$/)
  await expect(page.getByRole('heading', { name })).toBeVisible()

  await page.goto('/plan')
  const today = page.locator('.week-day.today')
  await today.locator('.empty-meal-slot').first().click()
  await page.getByRole('button', { name: new RegExp(name) }).click()
  await page.getByLabel('Кількість порцій').fill('2')
  await page.getByRole('button', { name: 'Додати до плану' }).click()
  await expect(page.getByRole('button', { name: new RegExp(`Відкрити рецепт ${name}`) })).toBeVisible()

  await page.goto('/shopping?range=7')
  await expect(page.getByRole('heading', { name: 'Покупки' })).toBeVisible()
  await expectNoSeriousAxe(page)
})

async function expectNoSeriousAxe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze()
  expect(results.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')).toEqual([])
}
