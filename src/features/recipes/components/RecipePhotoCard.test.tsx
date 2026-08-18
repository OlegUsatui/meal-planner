import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RecipePhotoCard } from './RecipePhotoCard'

describe('RecipePhotoCard', () => {
  it('selects a replacement and exposes removal only when a photo exists', async () => {
    const onSelect = vi.fn()
    const onRemove = vi.fn()
    const { rerender } = render(<RecipePhotoCard onSelect={onSelect} onRemove={onRemove} />)
    expect(screen.queryByRole('button', { name: 'Прибрати фото' })).not.toBeInTheDocument()
    const file = new File(['photo'], 'dish.jpg', { type: 'image/jpeg' })
    await userEvent.upload(screen.getByLabelText('Завантажити фото'), file)
    expect(onSelect).toHaveBeenCalledWith(file)

    rerender(<RecipePhotoCard imageUrl="/dish.webp" onSelect={onSelect} onRemove={onRemove} />)
    await userEvent.click(screen.getByRole('button', { name: 'Прибрати фото' }))
    expect(onRemove).toHaveBeenCalledOnce()
  })
})
