import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '../../shared/ui/Button'

interface State { failed: boolean }

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State { return { failed: true } }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Personal recipe content and account data must never be logged here.
  }

  render() {
    if (!this.state.failed) return this.props.children
    return <main className="recovery-page"><section className="recovery-card"><p className="eyebrow">Безпечне відновлення</p><h1>Щось пішло не так</h1><p>Ваші серверні дані не змінено. Перезавантажте застосунок і спробуйте ще раз.</p><Button type="button" onClick={() => window.location.reload()}>Перезавантажити</Button></section></main>
  }
}
