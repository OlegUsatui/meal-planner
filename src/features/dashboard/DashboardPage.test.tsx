import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardRepositoryProvider } from './DashboardRepositoryContext'
import type { DashboardRepository } from './types'
import { DashboardPage } from './DashboardPage'
import { QueryTestProvider } from '../../shared/testing/QueryTestProvider'

describe('DashboardPage', () => {
  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); vi.setSystemTime(new Date('2026-08-14T12:00:00')) })
  afterEach(() => { vi.useRealTimers() })

  it('shows today meals, empty slots and a seven-day shopping preview', async () => {
    const repository: DashboardRepository = { get: vi.fn().mockResolvedValue({ today: '2026-08-14', todayEntries: [{ id: 'e1', date: '2026-08-14', slot: 'dinner', recipeId: 'r1', recipeName: 'Тепла миска', servings: 2 }], nextEntry: { id: 'e1', date: '2026-08-14', slot: 'dinner', recipeId: 'r1', recipeName: 'Тепла миска', servings: 2 }, sevenDayShoppingCount: 8, hasPersonalRecipes: false, hasPersonalProducts: false, hasPlanEntries: true }) }
    render(<QueryTestProvider><MemoryRouter><DashboardRepositoryProvider repository={repository}><DashboardPage /></DashboardRepositoryProvider></MemoryRouter></QueryTestProvider>)

    expect(await screen.findByRole('heading', { name: 'Сьогодні' })).toBeInTheDocument()
    expect(repository.get).toHaveBeenCalledWith('2026-08-14')
    expect(screen.getAllByText('Тепла миска')).toHaveLength(2)
    expect(screen.getByText('8 продуктів')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Запланувати/ })).toHaveLength(3)
    expect(screen.queryByText('Перший крок')).not.toBeInTheDocument()
  })

  it('shows setup guidance only before the first plan entry', async () => {
    const repository: DashboardRepository = { get: vi.fn().mockResolvedValue({ today: '2026-08-14', todayEntries: [], nextEntry: null, sevenDayShoppingCount: 0, hasPersonalRecipes: false, hasPersonalProducts: false, hasPlanEntries: false }) }
    render(<QueryTestProvider><MemoryRouter><DashboardRepositoryProvider repository={repository}><DashboardPage /></DashboardRepositoryProvider></MemoryRouter></QueryTestProvider>)
    expect(await screen.findByText('Перший крок')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Запланувати страву' })).toHaveAttribute('href', '/plan?date=2026-08-14')
  })

  it('deduplicates the initial request in StrictMode', async () => {
    const repository: DashboardRepository = { get: vi.fn().mockResolvedValue({ today: '2026-08-14', todayEntries: [], nextEntry: null, sevenDayShoppingCount: 0, hasPersonalRecipes: false, hasPersonalProducts: false, hasPlanEntries: true }) }

    render(<StrictMode><QueryTestProvider><MemoryRouter><DashboardRepositoryProvider repository={repository}><DashboardPage /></DashboardRepositoryProvider></MemoryRouter></QueryTestProvider></StrictMode>)

    expect(await screen.findByRole('heading', { name: 'Страви на сьогодні' })).toBeInTheDocument()
    expect(repository.get).toHaveBeenCalledOnce()
  })
})
