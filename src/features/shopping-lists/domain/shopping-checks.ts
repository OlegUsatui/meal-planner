import type { ShoppingListRange } from '../types'

const storagePrefix = 'meal-planner:shopping-checks'

export function shoppingChecksStorageKey(userId: string, range: ShoppingListRange): string {
  return `${storagePrefix}:${userId}:${range.from}:${range.to ?? 'all'}`
}

export function readShoppingChecks(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set()

  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? '[]')
    return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [])
  } catch {
    return new Set()
  }
}

export function writeShoppingChecks(key: string, productIds: Iterable<string>): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify([...new Set(productIds)].sort()))
  } catch {
    // The checklist remains usable when browser storage is unavailable or full.
  }
}
