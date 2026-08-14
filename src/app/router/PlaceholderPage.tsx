import { Link } from 'react-router-dom'

interface PlaceholderPageProps {
  eyebrow: string
  title: string
  description: string
  action?: { label: string; to: string }
}

export function PlaceholderPage({ eyebrow, title, description, action }: PlaceholderPageProps) {
  return (
    <section className="page placeholder-page">
      <div className="placeholder-card"><div className="placeholder-mark" aria-hidden="true">✦</div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p>{action && <Link className="button button-primary" to={action.to}>{action.label}</Link>}</div>
    </section>
  )
}
