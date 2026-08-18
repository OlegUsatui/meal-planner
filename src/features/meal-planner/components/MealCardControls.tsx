import { useState } from 'react'
import { ActionMenu } from '../../../shared/ui/ActionMenu'

const servingOptions = Array.from({ length: 99 }, (_, index) => index + 1)

interface MealCardControlsProps {
  recipeName: string
  servings: number
  readOnly: boolean
  variant: 'day' | 'week'
  onServingsChange: (servings: number) => Promise<void> | void
  onReplace: () => void
  onRemove: () => void
}

export function MealCardControls({ recipeName, servings, readOnly, variant, onServingsChange, onReplace, onRemove }: MealCardControlsProps) {
  const [pending, setPending] = useState(false)
  const updateServings = async (next: number) => {
    setPending(true)
    try { await onServingsChange(next) } finally { setPending(false) }
  }
  const items = [{ label: 'Замінити', onSelect: onReplace }, { label: 'Видалити', onSelect: onRemove, danger: true }]
  const classes = variant === 'day' ? 'day-meal-card-menu-wrap' : 'meal-card-menu-wrap'
  const footerClass = variant === 'day' ? 'day-meal-card-footer' : `meal-card-servings ${readOnly ? 'read-only' : ''}`
  return <>
    <div className={footerClass}><span>Порції</span>{readOnly ? <strong>{servings}</strong> : <select aria-label={`Кількість порцій для ${recipeName}`} value={servings} disabled={pending} onChange={(event) => void updateServings(Number(event.target.value))}>{servingOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>}</div>
    {!readOnly && <ActionMenu label={`Дії для ${recipeName}`} items={items} className={classes} triggerClassName="meal-menu-trigger" menuClassName="meal-card-menu" />}
  </>
}
