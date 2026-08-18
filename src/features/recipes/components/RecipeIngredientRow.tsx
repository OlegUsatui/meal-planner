import { Trash2 } from 'lucide-react'
import type { DisplayUnit } from '../../products/domain/product'
import type { Product } from '../../products/types'
import { IconButton } from '../../../shared/ui/Button'

export type RecipeIngredientDraft = { key: string; productId: string; quantity: string; unit: DisplayUnit }

type Props = {
  row: RecipeIngredientDraft
  index: number
  products: Product[]
  rowCount: number
  onChange: (index: number, update: Partial<RecipeIngredientDraft>) => void
  onRemove: () => void
}

const units = (unit: Product['baseUnit']): DisplayUnit[] => unit === 'g' ? ['g', 'kg'] : unit === 'ml' ? ['ml', 'l'] : ['pcs']

export function RecipeIngredientRow({ row, index, products, rowCount, onChange, onRemove }: Props) {
  const product = products.find((item) => item.id === row.productId)
  const availableProducts = products.filter((item) => !item.archivedAt || item.id === row.productId)
  return <div className="ingredient-row"><label>Продукт<select value={row.productId} onChange={(event) => { const selected = products.find((item) => item.id === event.target.value); onChange(index, { productId: event.target.value, unit: selected?.baseUnit ?? 'g' }) }}><option value="">Оберіть продукт</option>{availableProducts.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Кількість<input inputMode="decimal" value={row.quantity} onChange={(event) => onChange(index, { quantity: event.target.value })} /></label><label>Одиниця<select value={row.unit} onChange={(event) => onChange(index, { unit: event.target.value as DisplayUnit })}>{units(product?.baseUnit ?? 'g').map((unit) => <option key={unit}>{unit}</option>)}</select></label><IconButton danger aria-label={`Видалити інгредієнт ${index + 1}`} onClick={onRemove} disabled={rowCount === 1}><Trash2 aria-hidden="true" /></IconButton></div>
}
