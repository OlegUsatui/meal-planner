import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ShoppingListRepositoryProvider } from '../repositories/ShoppingListRepositoryContext'
import type { ShoppingListRepository } from '../types'
import { ShoppingListPage } from './ShoppingListPage'
import { QueryTestProvider } from '../../../shared/testing/QueryTestProvider'

describe('ShoppingListPage', () => {
  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); vi.setSystemTime(new Date('2026-08-14T12:00:00')) })
  afterEach(() => { vi.useRealTimers() })

  it('loads the next seven days, groups products and explains each source', async () => {
    const repository: ShoppingListRepository = { list: vi.fn().mockResolvedValue([{ productId: 'rice', productName: 'Рис', category: 'Крупи та макарони', baseUnit: 'g', quantityBase: 2500, sources: [{ date: '2026-08-15', slot: 'dinner', recipeId: 'r1', recipeName: 'Рисова миска', servings: 2, quantityBase: 2500 }] }]) }
    render(<QueryTestProvider><MemoryRouter><ShoppingListRepositoryProvider repository={repository}><ShoppingListPage /></ShoppingListRepositoryProvider></MemoryRouter></QueryTestProvider>)

    expect(await screen.findByRole('heading', { name: 'Крупи та макарони' })).toBeInTheDocument()
    expect(repository.list).toHaveBeenCalledWith({ from: '2026-08-14', to: '2026-08-20' }, expect.any(AbortSignal))
    expect(screen.getByText('2,5 кг')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Рис/ }))
    expect(screen.getByText(/Вечеря · Рисова миска · 2 порц/)).toBeInTheDocument()
  })

  it('reloads for a selected preset and keeps stale data on failure', async () => {
    const repository: ShoppingListRepository = { list: vi.fn().mockResolvedValueOnce([{ productId: 'rice', productName: 'Рис', category: 'Крупи', baseUnit: 'g', quantityBase: 100, sources: [] }]).mockRejectedValueOnce(new Error('offline')) }
    render(<QueryTestProvider><MemoryRouter><ShoppingListRepositoryProvider repository={repository}><ShoppingListPage /></ShoppingListRepositoryProvider></MemoryRouter></QueryTestProvider>)
    expect(await screen.findByText('Рис')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '14 днів' }))

    await waitFor(() => expect(repository.list).toHaveBeenLastCalledWith({ from: '2026-08-14', to: '2026-08-27' }, expect.any(AbortSignal)))
    expect(screen.getByText('Рис')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/останній завантажений список/i)
  })

  it('restores a custom inclusive range from the URL', async () => {
    const repository: ShoppingListRepository = { list: vi.fn().mockResolvedValue([]) }
    render(<QueryTestProvider><MemoryRouter initialEntries={['/shopping?range=custom&from=2026-09-01&to=2026-09-12']}><ShoppingListRepositoryProvider repository={repository}><ShoppingListPage /></ShoppingListRepositoryProvider></MemoryRouter></QueryTestProvider>)

    await waitFor(() => expect(repository.list).toHaveBeenCalledWith({ from: '2026-09-01', to: '2026-09-12' }, expect.any(AbortSignal)))
    expect(screen.getByLabelText('Від')).toHaveValue('2026-09-01')
    expect(screen.getByLabelText('До')).toHaveValue('2026-09-12')
  })
})
