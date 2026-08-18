import { Search } from 'lucide-react'

type SearchFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function SearchField({ label, value, onChange, placeholder, className = '', disabled = false }: SearchFieldProps) {
  return <label className={`search-field ${className}`.trim()}>
    <Search aria-hidden="true" />
    <span className="sr-only">{label}</span>
    <input type="search" aria-label={label} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} />
  </label>
}
