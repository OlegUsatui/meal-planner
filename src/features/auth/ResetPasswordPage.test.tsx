import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ResetPasswordPage } from './ResetPasswordPage'

const updatePassword = vi.fn()
vi.mock('./useAuth', () => ({ useAuth: () => ({ updatePassword, session: { user: { email: 'user@example.com' } } }) }))

describe('ResetPasswordPage', () => {
  it('validates confirmation and updates the recovered password', async () => {
    render(<MemoryRouter><ResetPasswordPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Новий пароль'), { target: { value: 'new-secret-123' } })
    fireEvent.change(screen.getByLabelText('Повторіть новий пароль'), { target: { value: 'new-secret-123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Зберегти новий пароль' }))
    await waitFor(() => expect(updatePassword).toHaveBeenCalledWith('new-secret-123'))
    expect(await screen.findByRole('status')).toHaveTextContent('Пароль оновлено')
  })
})
