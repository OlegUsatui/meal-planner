import type { BaseUnit } from '../domain/product'

export interface ImportedIngredientRow {
  product_id: string
  quantity_base: number
  entered_quantity: number
  entered_unit: BaseUnit
}

export function mergeImportedIngredients(rows: ImportedIngredientRow[]): ImportedIngredientRow[] {
  const merged = new Map<string, ImportedIngredientRow>()
  for (const row of rows) {
    const existing = merged.get(row.product_id)
    if (!existing) {
      merged.set(row.product_id, { ...row })
      continue
    }
    const quantity = round(existing.quantity_base + row.quantity_base)
    existing.quantity_base = quantity
    existing.entered_quantity = quantity
    existing.entered_unit = row.entered_unit
  }
  return [...merged.values()]
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}
