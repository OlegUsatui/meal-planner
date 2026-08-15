export type BaseUnit = 'g' | 'ml' | 'pcs'
export type DisplayUnit = 'g' | 'kg' | 'ml' | 'l' | 'pcs'

export const productCategories = [
  'Овочі та зелень', 'Фрукти', 'М’ясо та птиця', 'Риба та морепродукти',
  'Молочні продукти', 'Яйця', 'Крупи та макарони', 'Бобові', 'Горіхи та насіння',
  'Рослинний білок', 'Соуси та олії', 'Спеції та зелень', 'Інше',
] as const

export interface ProductInput {
  name: string
  category: string
  baseUnit: BaseUnit
}

export interface ProductValidationErrors {
  name?: string
  category?: string
}

const unitDimension: Record<DisplayUnit, 'mass' | 'volume' | 'count'> = {
  g: 'mass',
  kg: 'mass',
  ml: 'volume',
  l: 'volume',
  pcs: 'count',
}

const unitMultiplier: Record<DisplayUnit, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  pcs: 1,
}

export function normalizeProductName(name: string): string {
  return name.trim().replace(/\s+/gu, ' ').toLocaleLowerCase('uk-UA')
}

export function normalizeQuantity(
  value: number,
  enteredUnit: DisplayUnit,
  baseUnit: BaseUnit,
): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('positive-quantity-required')
  }
  if (unitDimension[enteredUnit] !== unitDimension[baseUnit]) {
    throw new Error('incompatible-unit')
  }
  if (baseUnit === 'pcs' && !Number.isInteger(value)) {
    throw new Error('whole-pieces-required')
  }

  const normalized = value * unitMultiplier[enteredUnit]
  return Math.round(normalized * 1000) / 1000
}

export function parseQuantity(input: string): number {
  const normalized = input.replace(/[\s\u00a0]/gu, '').replace(',', '.')
  if (!/^\d+(?:\.\d{1,3})?$/.test(normalized)) {
    throw new Error('invalid-quantity')
  }
  const quantity = Number(normalized)
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error('invalid-quantity')
  }
  return quantity
}

export function validateProductInput(
  input: ProductInput,
): ProductValidationErrors {
  const errors: ProductValidationErrors = {}
  const name = input.name.trim()

  if (!name) errors.name = 'Вкажіть назву продукту'
  else if (name.length > 120) errors.name = 'Назва має містити до 120 символів'

  if (!input.category.trim()) errors.category = 'Вкажіть категорію'

  return Object.fromEntries(
    Object.entries(errors).filter(([, value]) => value !== undefined),
  )
}

export function hasValidationErrors(errors: ProductValidationErrors): boolean {
  return Object.keys(errors).length > 0
}
