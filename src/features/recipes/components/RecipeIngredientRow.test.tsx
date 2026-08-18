import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { Product } from '../../products/types'
import { RecipeIngredientRow, type RecipeIngredientDraft } from './RecipeIngredientRow'

const product: Product = { id: 'rice', name: 'Рис', normalizedName: 'рис', category: 'Крупи та макарони', baseUnit: 'g', archivedAt: null, createdAt: 'now', updatedAt: 'now', recipeUsageCount: 0, isBaseUnitLocked: false }
const row: RecipeIngredientDraft = { key: 'row', productId: '', quantity: '', unit: 'g' }

describe('RecipeIngredientRow', () => {
  it('updates the product and quantity through one shared row', async () => {
    const onChange = vi.fn()
    function Harness() {
      const [current, setCurrent] = useState(row)
      return <RecipeIngredientRow row={current} index={0} products={[product]} rowCount={2} onChange={(index, update) => { onChange(index, update); setCurrent((value) => ({ ...value, ...update })) }} onRemove={vi.fn()} />
    }
    render(<Harness />)
    await userEvent.selectOptions(screen.getByLabelText('Продукт'), 'rice')
    await userEvent.type(screen.getByLabelText('Кількість'), '100')
    expect(onChange).toHaveBeenCalledWith(0, { productId: 'rice', unit: 'g' })
    expect(onChange).toHaveBeenLastCalledWith(0, { quantity: '100' })
  })
})
