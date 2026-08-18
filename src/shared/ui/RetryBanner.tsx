import type { ReactNode } from 'react'
import { Alert } from './Alert'
import { Button } from './Button'

type RetryBannerProps = {
  hasData: boolean
  staleMessage: ReactNode
  errorMessage: ReactNode
  onRetry: () => void
  pending?: boolean
}

export function RetryBanner({ hasData, staleMessage, errorMessage, onRetry, pending = false }: RetryBannerProps) {
  return <Alert variant="warning" className="stale-banner" actions={<Button variant="secondary" onClick={onRetry} disabled={pending}>{pending ? 'Повторюємо…' : 'Повторити'}</Button>}>{hasData ? staleMessage : errorMessage}</Alert>
}
