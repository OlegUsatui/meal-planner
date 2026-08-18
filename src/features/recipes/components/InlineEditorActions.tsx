import { Pencil } from 'lucide-react'
import { FormActions } from '../../../shared/ui/FormActions'
import { IconButton } from '../../../shared/ui/Button'

export function InlineEditorActions(props: { saveLabel: string; pending: boolean; onCancel: () => void }) { return <FormActions {...props} /> }

export function InlineEditButton({ label, disabled = false, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
  return <IconButton className="inline-edit-button" aria-label={label} onClick={onClick} disabled={disabled}><Pencil aria-hidden="true" size={17} /></IconButton>
}
