import { Button } from './Button'

type FormActionsProps = {
  saveLabel: string
  pending: boolean
  onCancel: () => void
  cancelLabel?: string
  pendingLabel?: string
}

export function FormActions({ saveLabel, pending, onCancel, cancelLabel = 'Скасувати', pendingLabel = 'Зберігаємо…' }: FormActionsProps) {
  return <div className="inline-editor-actions"><Button variant="secondary" onClick={onCancel} disabled={pending}>{cancelLabel}</Button><Button type="submit" disabled={pending}>{pending ? pendingLabel : saveLabel}</Button></div>
}
