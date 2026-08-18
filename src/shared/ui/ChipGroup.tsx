type ChipOption = { value: string; label: string }

type ChipGroupProps = {
  options: ChipOption[]
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  className?: string
}

export function ChipGroup({ options, value, onChange, ariaLabel, className = '' }: ChipGroupProps) {
  return <div className={`chip-group ${className}`.trim()} role="group" aria-label={ariaLabel}>
    {options.map((option) => <button type="button" key={option.value} aria-pressed={value === option.value} className={value === option.value ? 'active' : ''} onClick={() => onChange(option.value)}>{option.label}</button>)}
  </div>
}
