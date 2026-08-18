import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from './Button'

export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  hasNext: boolean
  onPageChange: (page: number) => void
  ariaLabel?: string
}

type PageItem = number | 'ellipsis-start' | 'ellipsis-end'

export function Pagination({ page, pageSize, total, hasNext, onPageChange, ariaLabel = 'Пагінація' }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const firstItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const lastItem = total === 0 ? 0 : Math.min(currentPage * pageSize, total)
  const items = getPageItems(currentPage, totalPages)

  if (totalPages <= 1 && total === 0) return null

  return (
    <nav className="pagination" aria-label={ariaLabel}>
      <p className="pagination-summary" aria-live="polite">Показано {firstItem}–{lastItem} із {total}</p>
      <div className="pagination-controls">
        <Button
          type="button"
          variant="secondary"
          className="pagination-nav-button"
          disabled={currentPage <= 1}
          aria-label="Перейти на попередню сторінку"
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ArrowLeft aria-hidden="true" /><span>Попередня</span>
        </Button>
        <div className="pagination-pages" aria-label="Сторінки">
          {items.map((item) => item === 'ellipsis-start' || item === 'ellipsis-end'
            ? <span className="pagination-ellipsis" aria-hidden="true" key={item}>…</span>
            : <button
                type="button"
                className={`pagination-page ${item === currentPage ? 'active' : ''}`}
                aria-current={item === currentPage ? 'page' : undefined}
                aria-label={`Сторінка ${item}`}
                onClick={() => onPageChange(item)}
                key={item}
              >
                {item}
              </button>)}
        </div>
        <Button
          type="button"
          variant="secondary"
          className="pagination-nav-button"
          disabled={!hasNext || currentPage >= totalPages}
          aria-label="Перейти на наступну сторінку"
          onClick={() => onPageChange(currentPage + 1)}
        >
          <span>Наступна</span><ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1)
  if (currentPage <= 3) return [1, 2, 3, 4, 'ellipsis-end', totalPages]
  if (currentPage >= totalPages - 2) return [1, 'ellipsis-start', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  return [1, 'ellipsis-start', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-end', totalPages]
}
