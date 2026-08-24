import { ActionMenu } from '../../../shared/ui/ActionMenu'

interface MealCardControlsProps {
  recipeName: string
  readOnly?: boolean
  onCopy?: () => void
  onPaste?: () => void
  onReplace: () => void
  onRemove: () => void
}

export function MealCardControls({ recipeName, readOnly = false, onCopy, onPaste, onReplace, onRemove }: MealCardControlsProps) {
  const items = [
    ...(onCopy ? [{ label: 'Копіювати', onSelect: onCopy }] : []),
    ...(onPaste ? [{ label: 'Вставити', onSelect: onPaste }] : []),
    { label: 'Замінити', onSelect: onReplace },
    { label: 'Видалити', onSelect: onRemove, danger: true },
  ]
  return readOnly ? null : <ActionMenu label={`Дії для ${recipeName}`} items={items} className="meal-card-menu-wrap" triggerClassName="meal-menu-trigger" menuClassName="meal-card-menu" />
}
