import { describe, expect, it } from 'vitest'
import { normalizeProductName, normalizeQuantity, parseQuantity, validateProductInput } from './product'
describe('product domain', () => {
  it('normalizes names and quantities', () => { expect(normalizeProductName('  Молоко   Безлактозне  ')).toBe('молоко безлактозне'); expect(normalizeQuantity(1.5, 'kg', 'g')).toBe(1500); expect(parseQuantity('1 250,25')).toBe(1250.25) })
  it('validates only minimal fields', () => { expect(validateProductInput({ name: ' ', category: '', baseUnit: 'pcs' })).toEqual({ name: 'Вкажіть назву продукту', category: 'Вкажіть категорію' }) })
})
