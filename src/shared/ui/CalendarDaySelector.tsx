type CalendarDaySelectorVariant = 'strip' | 'grid' | 'day'

interface CalendarDaySelectorProps {
  dates: readonly string[]
  today: string
  selectedDate?: string
  onSelect: (date: string) => void
  variant: CalendarDaySelectorVariant
  className?: string
}

export function CalendarDaySelector({ dates, today, selectedDate, onSelect, variant, className = '' }: CalendarDaySelectorProps) {
  const buttons = dates.map((date) => {
    const parsed = parseLocalDate(date)
    const selected = date === selectedDate
    const label = parsed.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })
    return <button type="button" key={date} className={`${variant === 'strip' ? '' : className} ${date === today ? 'today' : ''} ${selected ? 'selected' : ''}`.trim()} aria-label={label} aria-selected={variant === 'grid' ? selected : undefined} role={variant === 'grid' ? 'columnheader' : undefined} onClick={() => onSelect(date)}><span>{parsed.toLocaleDateString('uk-UA', { weekday: 'short' })}</span><strong>{parsed.getDate()}</strong></button>
  })
  if (variant === 'strip') return <div className={`calendar-day-selector calendar-day-selector-strip ${className}`.trim()} aria-label="Дні тижня">{buttons}</div>
  return <>{buttons}</>
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}
