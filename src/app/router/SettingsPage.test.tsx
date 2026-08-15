import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../../features/auth/auth-context'
import { SettingsPage } from './SettingsPage'

describe('SettingsPage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('requires password reauthentication and the exact deletion phrase', async () => {
    const reauthenticate = vi.fn().mockResolvedValue('fresh-token')
    const signOut = vi.fn().mockResolvedValue(undefined)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: null }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    renderSettings({ reauthenticate, signOut })

    await userEvent.click(screen.getByRole('button', { name: 'Видалити акаунт' }))
    const confirm = screen.getByRole('button', { name: 'Видалити акаунт назавжди' })
    expect(confirm).toBeDisabled()
    await userEvent.type(screen.getByLabelText('Поточний пароль'), 'secret-pass')
    await userEvent.type(screen.getByLabelText('Підтвердження'), 'ВИДАЛИТИ АКАУНТ')
    expect(confirm).toBeEnabled()
    await userEvent.click(confirm)

    expect(reauthenticate).toHaveBeenCalledWith('secret-pass')
    expect(fetch).toHaveBeenCalledWith('/api/account', expect.objectContaining({ method: 'DELETE', headers: expect.objectContaining({ Authorization: 'Bearer fresh-token' }) }))
    expect(signOut).toHaveBeenCalledOnce()
  })

  it('links to informational onboarding without changing completion', () => {
    renderSettings({ reauthenticate: vi.fn(), signOut: vi.fn() })
    expect(screen.getByRole('link', { name: 'Переглянути знайомство' })).toHaveAttribute('href', '/welcome?info=1')
  })
})

function renderSettings(overrides: Partial<AuthContextValue>) {
  const auth = { session: { access_token: 'token', user: { email: 'user@example.com' } }, loading: false, roleLoading: false, profileLoading: false, isAdmin: false, onboardingCompleted: true, signIn: vi.fn(), signUp: vi.fn(), resendSignup: vi.fn(), resetPassword: vi.fn(), updatePassword: vi.fn(), updateEmail: vi.fn(), reauthenticate: vi.fn(), completeOnboarding: vi.fn(), signOut: vi.fn(), ...overrides } as unknown as AuthContextValue
  return render(<MemoryRouter><AuthContext value={auth}><SettingsPage /></AuthContext></MemoryRouter>)
}
