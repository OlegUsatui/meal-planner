import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: ReactNode
  eyebrow?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, eyebrow, description, actions, className = '' }: PageHeaderProps) {
  return <header className={`page-header ${className}`.trim()}>
    <div className="page-header-copy">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p className="page-intro">{description}</p>}
    </div>
    {actions && <div className="page-header-actions">{actions}</div>}
  </header>
}
