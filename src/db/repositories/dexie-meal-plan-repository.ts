import type { MealPlannerDatabase } from '../database'
import { isPastMealPlanDate, validateMealPlanInput, type MealPlanInput, type MealSlot } from '../../features/meal-planner/domain/meal-plan'
import { MealPlanRepositoryError, type MealPlanEntry, type MealPlanRange, type MealPlanRepository } from '../../features/meal-planner/types'

interface Runtime {
  now: () => string
  id: () => string
  today: () => string
}

const defaultRuntime: Runtime = {
  now: () => new Date().toISOString(),
  id: () => crypto.randomUUID(),
  today: () => new Intl.DateTimeFormat('sv-SE').format(new Date()),
}

export class DexieMealPlanRepository implements MealPlanRepository {
  private readonly database: MealPlannerDatabase
  private readonly runtime: Runtime

  constructor(database: MealPlannerDatabase, runtime: Runtime = defaultRuntime) {
    this.database = database
    this.runtime = runtime
  }

  async list(range: MealPlanRange = {}): Promise<MealPlanEntry[]> {
    const records = await this.database.mealPlanEntries.toArray()
    return records
      .filter((record) => (!range.from || record.date >= range.from) && (!range.to || record.date <= range.to))
      .sort((left, right) => left.date.localeCompare(right.date) || left.dateSlot.localeCompare(right.dateSlot))
      .map(toEntry)
  }

  async getByDateSlot(date: string, slot: MealSlot): Promise<MealPlanEntry | undefined> {
    const record = await this.database.mealPlanEntries.where('dateSlot').equals(`${date}:${slot}`).first()
    return record ? toEntry(record) : undefined
  }

  async upsert(input: MealPlanInput): Promise<MealPlanEntry> {
    const errors = validateMealPlanInput(input)
    if (Object.keys(errors).length) throw new MealPlanRepositoryError('invalid-plan', 'Некоректний запис плану')
    if (isPastMealPlanDate(input.date, this.runtime.today())) throw new MealPlanRepositoryError('past-date', 'Не можна планувати страви на минулу дату')

    const id = `${input.date}:${input.slot}`
    const current = await this.database.mealPlanEntries.where('dateSlot').equals(id).first()
    const now = this.runtime.now()
    const record = {
      id: current?.id ?? this.runtime.id(),
      date: input.date,
      slot: input.slot,
      dateSlot: id,
      recipeId: input.recipeId,
      servings: input.servings,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    }
    await this.database.mealPlanEntries.put(record)
    return toEntry(record)
  }

  async remove(id: string): Promise<void> {
    const current = await this.database.mealPlanEntries.get(id)
    if (!current) throw new MealPlanRepositoryError('not-found', 'Запис плану не знайдено')
    await this.database.mealPlanEntries.delete(id)
  }
}

function toEntry(record: {
  id: string
  date: string
  slot: MealSlot
  recipeId: string
  servings: number
  createdAt: string
  updatedAt: string
}): MealPlanEntry {
  return { id: record.id, date: record.date, slot: record.slot, recipeId: record.recipeId, servings: record.servings, createdAt: record.createdAt, updatedAt: record.updatedAt }
}
