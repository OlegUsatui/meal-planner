import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type BackLinkProps = {
  to: string
  children: ReactNode
}

export function BackLink({ to, children }: BackLinkProps) {
  return <Link className="back-link" to={to}><ArrowLeft aria-hidden="true" /> {children}</Link>
}
