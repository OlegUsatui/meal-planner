import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  illustration?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, eyebrow, illustration, action, className = '' }: EmptyStateProps) {
  return <div className={`empty-state ${className}`.trim()}>
    {illustration && <div className="empty-illustration" aria-hidden="true">{illustration}</div>}
    {eyebrow && <p className="eyebrow">{eyebrow}</p>}
    <h2>{title}</h2>
    {description && <p>{description}</p>}
    {action}
  </div>
}
