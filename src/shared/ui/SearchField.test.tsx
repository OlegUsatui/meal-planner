import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SearchField } from './SearchField'

describe('SearchField', () => {
  it('renders a labelled search control and emits the new value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SearchField label="Пошук рецептів" value="" onChange={onChange} />)

    await user.type(screen.getByRole('searchbox', { name: 'Пошук рецептів' }), 'суп')
    expect(onChange).toHaveBeenLastCalledWith('п')
  })
})
