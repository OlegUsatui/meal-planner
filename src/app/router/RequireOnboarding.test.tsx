import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../../features/auth/auth-context'
import { RequireOnboarding } from './RequireOnboarding'

it('redirects an incomplete profile to welcome and preserves the requested URL', async () => {
  const auth = { session: {}, loading: false, roleLoading: false, profileLoading: false, isAdmin: false, onboardingCompleted: false, signIn: vi.fn(), signUp: vi.fn(), resendSignup: vi.fn(), resetPassword: vi.fn(), updatePassword: vi.fn(), updateEmail: vi.fn(), reauthenticate: vi.fn(), completeOnboarding: vi.fn(), signOut: vi.fn() } as unknown as AuthContextValue
  const router = createMemoryRouter([{ path: '/welcome', element: <h1>Вітання</h1> }, { path: '/recipes', element: <RequireOnboarding><h1>Рецепти</h1></RequireOnboarding> }], { initialEntries: ['/recipes?query=рис'] })
  render(<AuthContext value={auth}><RouterProvider router={router} /></AuthContext>)
  expect(await screen.findByRole('heading', { name: 'Вітання' })).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/welcome')
  expect(router.state.location.search).toBe('?returnTo=%2Frecipes%3Fquery%3D%D1%80%D0%B8%D1%81')
})
