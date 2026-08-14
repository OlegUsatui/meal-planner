import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('exposes the five primary destinations and renders route content', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <AppShell />,
          children: [{ index: true, element: <h1>Ваш план</h1> }],
        },
      ],
      { initialEntries: ['/'] },
    )
    render(<RouterProvider router={router} />)

    expect(screen.getByRole('main')).toHaveTextContent('Ваш план')
    for (const name of ['Головна', 'План', 'Рецепти', 'Продукти', 'Покупки']) {
      expect(screen.getAllByRole('link', { name: new RegExp(name) }).length).toBeGreaterThan(0)
    }
  })
})
