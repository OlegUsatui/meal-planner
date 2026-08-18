import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProductForm } from './ProductForm'
describe('ProductForm', () => {
  it('submits minimal values', async () => { const user = userEvent.setup(); const onSubmit = vi.fn().mockResolvedValue(undefined); render(<ProductForm mode="create" onSubmit={onSubmit} />); await user.type(screen.getByLabelText('Назва продукту'), 'Рис жасмин'); await user.selectOptions(screen.getByLabelText('Категорія'), 'Крупи та макарони'); await user.selectOptions(screen.getByLabelText('Базова одиниця'), 'g'); await user.click(screen.getByRole('button', { name: 'Створити продукт' })); expect(onSubmit).toHaveBeenCalledWith({ name: 'Рис жасмин', category: 'Крупи та макарони', baseUnit: 'g' }) })
  it('shows required errors', async () => { const user = userEvent.setup(); render(<ProductForm mode="create" onSubmit={vi.fn()} />); await user.click(screen.getByRole('button', { name: 'Створити продукт' })); expect(screen.getByText('Вкажіть назву продукту')).toBeInTheDocument(); expect(screen.getByText('Вкажіть категорію')).toBeInTheDocument() })
  it('asks for confirmation before changing a referenced base unit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ProductForm mode="edit" recipeUsageCount={5} initialValues={{ name: 'Молоко', category: 'Молочні продукти', baseUnit: 'g' }} onSubmit={onSubmit} />)
    await user.selectOptions(screen.getByLabelText('Базова одиниця'), 'ml')
    await user.click(screen.getByRole('button', { name: 'Зберегти зміни' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('використовується у 5 рецептах')
    expect(onSubmit).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Змінити одиницю' }))
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Молоко', category: 'Молочні продукти', baseUnit: 'ml' })
  })
})
