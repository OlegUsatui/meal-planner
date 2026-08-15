import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthPage } from './AuthPage'

const auth = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  resetPassword: vi.fn(),
  signOut: vi.fn(),
  resendSignup: vi.fn(),
}))

vi.mock('./useAuth', () => ({ useAuth: () => ({ ...auth, session: null, loading: false }) }))

describe('AuthPage', () => {
  afterEach(() => sessionStorage.clear())
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
    expect(screen.getByLabelText('Повторіть пароль')).toBeInTheDocument()
  })

  it('blocks account creation when passwords do not match', async () => {
    render(<AuthPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Створити новий акаунт' }))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'secret123' } })
    fireEvent.change(screen.getByLabelText('Повторіть пароль'), { target: { value: 'different123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Зареєструватися' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Паролі не збігаються')
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it('can reveal and hide the password', () => {
    render(<AuthPage />)
    const password = screen.getByLabelText('Пароль')
    expect(password).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Показати пароль' }))
    expect(password).toHaveAttribute('type', 'text')
  })

  it('explains session expiry once before a safe sign-in', () => {
    sessionStorage.setItem('meal-planner:session-expired', '1')
    render(<AuthPage />)
    expect(screen.getByRole('alert')).toHaveTextContent(/сесія завершилася/i)
    expect(sessionStorage.getItem('meal-planner:session-expired')).toBeNull()
  })
})
