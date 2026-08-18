import type { ReactNode } from 'react'

type LoadingStateProps = {
  children: ReactNode
  className?: string
}

export function LoadingState({ children, className = '' }: LoadingStateProps) {
  return <div className={`loading-panel ${className}`.trim()} role="status" aria-live="polite">{children}</div>
}
