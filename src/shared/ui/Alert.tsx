import type { ReactNode } from 'react'

type AlertVariant = 'error' | 'success' | 'warning' | 'info'

type AlertProps = {
  variant: AlertVariant
  children: ReactNode
  title?: ReactNode
  actions?: ReactNode
  className?: string
}

export function Alert({ variant, children, title, actions, className = '' }: AlertProps) {
  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status'
  return <div className={`alert alert-${variant} ${className}`.trim()} role={role} aria-live={role === 'status' ? 'polite' : undefined}>
    {title && <strong>{title}</strong>}
    <span>{children}</span>
    {actions && <div className="alert-actions">{actions}</div>}
  </div>
}
