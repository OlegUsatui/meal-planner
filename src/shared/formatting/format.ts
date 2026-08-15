import type { BaseUnit } from '../../features/products/domain/product'

const nokFormatter = new Intl.NumberFormat('uk-UA', {
  style: 'currency',
  currency: 'NOK',
  minimumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat('uk-UA', {
  maximumFractionDigits: 3,
})

export function formatNok(ore: number): string {
  return nokFormatter.format(ore / 100)
}

export function formatQuantity(value: number, unit: BaseUnit): string {
  return `${numberFormatter.format(value)} ${unit === 'pcs' ? 'шт' : unit}`
}

export function formatShoppingQuantity(value: number, unit: BaseUnit): string {
  if (unit === 'g' && value >= 1000) return `${numberFormatter.format(value / 1000)} кг`
  if (unit === 'ml' && value >= 1000) return `${numberFormatter.format(value / 1000)} л`
  return formatQuantity(value, unit)
}

export function formatNokInput(ore: number): string {
  return (ore / 100).toFixed(2).replace('.', ',')
}
