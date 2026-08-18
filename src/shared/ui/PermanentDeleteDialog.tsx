import { Dialog } from './Dialog'
import { Button } from './Button'

export function PermanentDeleteDialog({
  name,
  entityLabel,
  onCancel,
  onConfirm,
}: {
  name: string
  entityLabel: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return <Dialog eyebrow="Небезпечна дія" title={`Видалити ${entityLabel} «${name}» назавжди?`} titleId="permanent-delete-title" onClose={onCancel} actions={<><Button variant="secondary" onClick={onCancel}>Скасувати</Button><Button variant="danger" onClick={onConfirm}>Видалити назавжди</Button></>}><p>Цю дію неможливо скасувати. Якщо запис використовується, система заблокує видалення та покаже причину.</p></Dialog>
}
