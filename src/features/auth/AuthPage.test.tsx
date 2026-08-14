import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthPage } from './AuthPage'

const auth = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  resetPassword: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('./useAuth', () => ({ useAuth: () => ({ ...auth, session: null, loading: false }) }))

describe('AuthPage', () => {
  it('signs in with email and password', async () => {
    render(<AuthPage />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Увійти' }))
    await waitFor(() => expect(auth.signIn).toHaveBeenCalledWith('user@example.com', 'secret123'))
  })

  it('switches to account creation', () => {
    render(<AuthPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Створити новий акаунт' }))
    expect(screen.getByRole('heading', { name: 'Створити акаунт' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Зареєструватися' })).toBeInTheDocument()
  })
})
