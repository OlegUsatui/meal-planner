import { CalendarDays, Carrot, ShoppingBasket, Soup, type LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'

export type FoodIllustrationVariant = 'breakfast' | 'meal' | 'planner' | 'produce' | 'shopping'

const icons: Record<FoodIllustrationVariant, ComponentType<LucideProps>> = {
  breakfast: Soup,
  meal: Soup,
  planner: CalendarDays,
  produce: Carrot,
  shopping: ShoppingBasket,
}

type Props = {
  variant: FoodIllustrationVariant
  label?: string
  className?: string
}

export function FoodIllustration({ variant, label, className = '' }: Props) {
  const Icon = icons[variant]
  return <span className={`food-illustration food-illustration-${variant} ${className}`.trim()} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}>
    <span className="food-illustration-orbit food-illustration-orbit-one" aria-hidden="true" />
    <span className="food-illustration-orbit food-illustration-orbit-two" aria-hidden="true" />
    <Icon aria-hidden="true" strokeWidth={1.5} />
  </span>
}
