import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type ChangeEvent } from 'react'
import { FormField } from './FormField'

type PasswordFieldProps = {
  label: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  autoComplete?: string
  id?: string
  error?: string
  hint?: string
  required?: boolean
  minLength?: number
  disabled?: boolean
}

export function PasswordField({ label, value, onChange, autoComplete, id, error, hint, required = false, minLength, disabled = false }: PasswordFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? `password-${generatedId.replaceAll(':', '')}`
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const [visible, setVisible] = useState(false)
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return <FormField label={label} id={fieldId} controlId={fieldId} error={error} hint={hint} required={required} control={<span className="password-input"><input id={fieldId} type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} minLength={minLength} disabled={disabled} required={required} aria-describedby={describedBy} aria-invalid={Boolean(error)} /><button type="button" aria-label={visible ? 'Сховати пароль' : 'Показати пароль'} onClick={() => setVisible((current) => !current)} disabled={disabled}>{visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></span>} />
}
