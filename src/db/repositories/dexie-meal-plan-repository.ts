import type { MealPlannerDatabase } from '../database'
import { isPastMealPlanDate, validateMealPlanInput, type MealPlanInput, type MealSlot } from '../../features/meal-planner/domain/meal-plan'
import { moveMealPlanEntries } from '../../features/meal-planner/domain/meal-plan-move'
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
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    }
    await this.database.mealPlanEntries.put(record)
    return toEntry(record)
  }

  async move(entryId: string, targetDate: string, targetSlot: MealSlot): Promise<void> {
    const targetInput = { date: targetDate, slot: targetSlot, recipeId: 'move' }
    if (Object.keys(validateMealPlanInput(targetInput)).length) throw new MealPlanRepositoryError('invalid-plan', 'Некоректний запис плану')
    await this.database.transaction('rw', this.database.mealPlanEntries, async () => {
      const source = await this.database.mealPlanEntries.get(entryId)
      if (!source) throw new MealPlanRepositoryError('not-found', 'Запис плану не знайдено')
      if (isPastMealPlanDate(source.date, this.runtime.today()) || isPastMealPlanDate(targetDate, this.runtime.today())) throw new MealPlanRepositoryError('past-date', 'Не можна змінювати план на минулу дату')
      if (source.date === targetDate && source.slot === targetSlot) return

      const sourceDateSlot = source.dateSlot
      const targetDateSlot = `${targetDate}:${targetSlot}`
      const target = await this.database.mealPlanEntries.where('dateSlot').equals(targetDateSlot).first()
      const move = moveMealPlanEntries(toEntry(source), target ? toEntry(target) : undefined, targetDate, targetSlot, this.runtime.today())
      if (!move) return
      const now = this.runtime.now()
      if (target) {
        await this.database.mealPlanEntries.update(source.id, { dateSlot: `__moving:${source.id}`, updatedAt: now })
        await this.database.mealPlanEntries.update(target.id, { date: move.target?.date, slot: move.target?.slot, dateSlot: sourceDateSlot, updatedAt: now })
      }
      await this.database.mealPlanEntries.update(source.id, { date: move.source.date, slot: move.source.slot, dateSlot: targetDateSlot, updatedAt: now })
    })
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
  createdAt: string
  updatedAt: string
}): MealPlanEntry {
  return { id: record.id, date: record.date, slot: record.slot, recipeId: record.recipeId, createdAt: record.createdAt, updatedAt: record.updatedAt }
}
