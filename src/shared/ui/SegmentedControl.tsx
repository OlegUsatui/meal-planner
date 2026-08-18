import type { ReactNode } from 'react'

export interface SegmentedControlOption<T extends string> {
  value: T
  label: ReactNode
}

interface SegmentedControlProps<T extends string> {
  value: T
  options: readonly SegmentedControlOption<T>[]
  onChange: (value: T) => void
  ariaLabel: string
  className?: string
}

export function SegmentedControl<T extends string>({ value, options, onChange, ariaLabel, className = '' }: SegmentedControlProps<T>) {
  return <div className={`segmented-control ${className}`.trim()} role="group" aria-label={ariaLabel}>{options.map((option) => <button type="button" key={option.value} aria-pressed={value === option.value} className={value === option.value ? 'active' : ''} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>
}
