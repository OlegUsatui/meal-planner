import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('exposes desktop and mobile destinations, a skip link, and renders route content', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <AppShell />,
          children: [{ index: true, element: <h1 tabIndex={-1}>Ваш план</h1> }],
        },
      ],
      { initialEntries: ['/'] },
    )
    render(<RouterProvider router={router} />)

    expect(screen.getByRole('main')).toHaveTextContent('Ваш план')
    expect(screen.getByRole('link', { name: 'Перейти до вмісту' })).toHaveAttribute('href', '#main-content')
    for (const name of ['Сьогодні', 'План', 'Рецепти', 'Продукти', 'Покупки', 'Ще', 'Налаштування']) {
      expect(screen.getAllByRole('link', { name: new RegExp(name) }).length).toBeGreaterThan(0)
    }
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Ваш план' })).toHaveFocus())
  })
})
