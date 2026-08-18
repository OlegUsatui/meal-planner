import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FormActions } from './FormActions'

describe('FormActions', () => {
  it('exposes cancel and submit actions with a pending label', async () => {
    const onCancel = vi.fn()
    render(<form><FormActions saveLabel="Зберегти" pending onCancel={onCancel} /></form>)
    expect(screen.getByRole('button', { name: 'Зберігаємо…' })).toBeDisabled()
    const cancel = screen.getByRole('button', { name: 'Скасувати' })
    expect(cancel).toBeDisabled()
    await userEvent.click(cancel)
    expect(onCancel).not.toHaveBeenCalled()
  })
})
