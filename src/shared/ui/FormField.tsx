import { cloneElement, useId, type ReactElement, type ReactNode } from 'react'

type ControlProps = { id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean; required?: boolean }

type FormFieldProps = {
  label: ReactNode
  control: ReactElement<ControlProps>
  id?: string
  controlId?: string
  error?: ReactNode
  hint?: ReactNode
  required?: boolean
  optional?: boolean
  className?: string
}

export function FormField({ label, control, id, controlId, error, hint, required = false, optional = false, className = '' }: FormFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? `field-${generatedId.replaceAll(':', '')}`
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  const enhancedControl = controlId ? control : cloneElement(control, {
    id: fieldId,
    'aria-describedby': describedBy,
    'aria-invalid': Boolean(error),
    required,
  })

  return <div className={`field ${error ? 'field-error' : ''} ${className}`.trim()}>
    <label className={required ? 'required' : undefined} htmlFor={controlId ?? fieldId}>{label}{optional && <span className="optional-label">необов’язково</span>}</label>
    {enhancedControl}
    {hint && <p id={hintId} className="field-hint">{hint}</p>}
    {error && <p id={errorId} className="field-error-text" aria-live="polite">{error}</p>}
  </div>
}
