import { Dialog } from './Dialog'
import { Button } from './Button'

interface Props {
  title: string
  description: string
  confirmLabel: string
  pending?: boolean
  danger?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({ title, description, confirmLabel, pending = false, danger = false, onCancel, onConfirm }: Props) {
  return <Dialog title={title} titleId="confirm-dialog-title" onClose={onCancel} actions={<><Button variant="secondary" disabled={pending} onClick={onCancel}>Скасувати</Button><Button variant={danger ? 'danger' : 'primary'} disabled={pending} onClick={onConfirm}>{pending ? 'Виконуємо…' : confirmLabel}</Button></>}><p>{description}</p></Dialog>
}
