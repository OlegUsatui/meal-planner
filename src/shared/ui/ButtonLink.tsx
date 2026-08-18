import { Link, type LinkProps } from 'react-router-dom'
import type { ReactNode } from 'react'

type ButtonLinkVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost'

export type ButtonLinkProps = Omit<LinkProps, 'children'> & {
  variant?: ButtonLinkVariant
  className?: string
  children: ReactNode
}

export function ButtonLink({ variant = 'primary', className = '', children, ...props }: ButtonLinkProps) {
  return <Link {...props} className={`button button-${variant} ${className}`.trim()}>{children}</Link>
}
