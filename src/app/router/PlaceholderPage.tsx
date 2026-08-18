import { ButtonLink } from '../../shared/ui/ButtonLink'

interface PlaceholderPageProps {
  eyebrow: string
  title: string
  description: string
  action?: { label: string; to: string }
}

export function PlaceholderPage({ eyebrow, title, description, action }: PlaceholderPageProps) {
  return (
    <section className="page placeholder-page">
      <div className="placeholder-card"><div className="placeholder-mark" aria-hidden="true">✦</div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p>{action && <ButtonLink to={action.to}>{action.label}</ButtonLink>}</div>
    </section>
  )
}
