import { Pencil } from 'lucide-react'

export function InlineEditorActions({ saveLabel, pending, onCancel }: { saveLabel: string; pending: boolean; onCancel: () => void }) {
  return <div className="inline-editor-actions"><button type="button" className="button button-secondary" onClick={onCancel} disabled={pending}>Скасувати</button><button type="submit" className="button button-primary" disabled={pending}>{pending ? 'Зберігаємо…' : saveLabel}</button></div>
}

export function InlineEditButton({ label, disabled = false, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
  return <button type="button" className="icon-button inline-edit-button" aria-label={label} onClick={onClick} disabled={disabled}><Pencil aria-hidden="true" size={17} /></button>
}
