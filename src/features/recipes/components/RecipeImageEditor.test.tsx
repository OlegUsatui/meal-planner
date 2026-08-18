import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RecipeImageEditor } from './RecipeImageEditor'

describe('RecipeImageEditor', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:recipe'), revokeObjectURL: vi.fn() })
  })

  it('shows a 4:3 crop workflow and allows cancelling without applying', async () => {
    const onApply = vi.fn()
    const onCancel = vi.fn()
    render(<RecipeImageEditor file={new File(['image'], 'dish.png', { type: 'image/png' })} onApply={onApply} onCancel={onCancel} />)

    const source = screen.getByRole('presentation')
    Object.defineProperty(source, 'naturalWidth', { value: 1600 })
    Object.defineProperty(source, 'naturalHeight', { value: 1200 })
    fireEvent.load(source)

    expect(screen.getByRole('heading', { name: 'Налаштуйте кадр 4:3' })).toBeVisible()
    expect(screen.getByRole('group', { name: 'Рамка обрізання 4:3' })).toBeVisible()
    expect(screen.getByRole('img', { name: 'Попередній перегляд фінального фото' })).toBeVisible()
    expect(screen.getByRole('slider', { name: 'Масштаб фото' })).toHaveValue('1')
    await userEvent.click(screen.getByRole('button', { name: 'Скасувати редагування фото' }))

    expect(onCancel).toHaveBeenCalledOnce()
    expect(onApply).not.toHaveBeenCalled()
  })
})
