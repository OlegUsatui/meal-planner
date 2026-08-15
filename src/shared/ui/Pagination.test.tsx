import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('shows a compact first-page range with accessible page controls', () => {
    render(<Pagination page={1} pageSize={24} total={137} hasNext onPageChange={vi.fn()} />)

    expect(screen.getByText('Показано 1–24 із 137')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Сторінка/ }).map((button) => button.textContent)).toEqual(['1', '2', '3', '4', '6'])
    expect(screen.getByRole('button', { name: 'Сторінка 1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Перейти на попередню сторінку' })).toBeDisabled()
  })

  it('shows the middle-page ellipses and changes page from a numbered button', async () => {
    const onPageChange = vi.fn()
    render(<Pagination page={4} pageSize={24} total={240} hasNext onPageChange={onPageChange} />)

    expect(screen.getAllByText('…')).toHaveLength(2)
    await userEvent.click(screen.getByRole('button', { name: 'Сторінка 5' }))
    expect(onPageChange).toHaveBeenCalledWith(5)
  })

  it('disables next on the last page and reports an empty result range', () => {
    render(<Pagination page={6} pageSize={24} total={137} hasNext={false} onPageChange={vi.fn()} />)

    expect(screen.getByText('Показано 121–137 із 137')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Перейти на наступну сторінку' })).toBeDisabled()
  })
})
