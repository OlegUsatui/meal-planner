import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { appRoutes } from './AppRouter'

it('redirects the retired welcome route to Today', async () => {
  const router = createMemoryRouter(appRoutes, { initialEntries: ['/welcome'] })
  render(<RouterProvider router={router} />)
  await waitFor(() => expect(router.state.location.pathname).toBe('/'))
})
