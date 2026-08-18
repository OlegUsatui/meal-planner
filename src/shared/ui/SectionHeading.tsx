import type { ReactNode } from 'react'

type SectionHeadingProps = {
  title: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
  titleId?: string
  className?: string
}

export function SectionHeading({ title, eyebrow, actions, titleId, className = '' }: SectionHeadingProps) {
  return <div className={`section-heading ${className}`.trim()}>
    <div>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={titleId}>{title}</h2>
    </div>
    {actions && <div className="section-heading-actions">{actions}</div>}
  </div>
}
