import { describe, expect, it } from 'vitest'
import { normalizeImportedIngredient } from './normalize-imported-product'

describe('normalizeImportedIngredient', () => {
  it('maps OCR variants and measurement fragments to canonical products', () => {
    expect(normalizeImportedIngredient('2 ч. л.), часник', 5, 'g')).toEqual({ name: 'Часник', category: 'Овочі та зелень', quantity: 5, unit: 'g' })
    expect(normalizeImportedIngredient('KypRчe філе', 180, 'g')).toEqual({ name: 'Куряче філе', category: 'М’ясо та птиця', quantity: 180, unit: 'g' })
    expect(normalizeImportedIngredient('Сосвийсоус лайт', 10, 'ml')).toEqual({ name: 'Соєвий соус', category: 'Соуси та олії', quantity: 10, unit: 'ml' })
  })

  it('drops alternatives and non-quantified seasoning placeholders', () => {
    expect(normalizeImportedIngredient('a60 шпинат', 60, 'g')).toBeNull()
    expect(normalizeImportedIngredient('Сіль i чорний перець за смаком', 1, 'g')).toBeNull()
    expect(normalizeImportedIngredient('1ч.л.', 1, 'g')).toBeNull()
  })

  it('uses canonical dimensions and converts egg grams to pieces', () => {
    expect(normalizeImportedIngredient('Оливкова олія 1 ч. л.', 5, 'g')).toEqual({ name: 'Оливкова олія', category: 'Соуси та олії', quantity: 5, unit: 'ml' })
    expect(normalizeImportedIngredient('Яйця курячі', 110, 'g')).toEqual({ name: 'Яйця', category: 'Яйця', quantity: 2, unit: 'pcs' })
  })

  it('chooses the last recognizable product when OCR joined two columns', () => {
    expect(normalizeImportedIngredient('Паста (cyxa) Куряче філе', 150, 'g')).toEqual({ name: 'Куряче філе', category: 'М’ясо та птиця', quantity: 150, unit: 'g' })
    expect(normalizeImportedIngredient('Куряче філе ОГІ |ЭТОПf1Я Г Сметана 15%', 90, 'g')).toEqual({ name: 'Сметана', category: 'Молочні продукти', quantity: 90, unit: 'g' })
  })

  it('normalizes staple ingredients from the breakfast and dinner books', () => {
    expect(normalizeImportedIngredient('Вівсяні пластівці', 50, 'g')).toEqual({ name: 'Вівсяні пластівці', category: 'Крупи та макарони', quantity: 50, unit: 'g' })
    expect(normalizeImportedIngredient('Банан', 0.5, 'pcs')).toEqual({ name: 'Банан', category: 'Фрукти', quantity: 0.5, unit: 'pcs' })
    expect(normalizeImportedIngredient('Панірувальні сухарі', 30, 'g')).toEqual({ name: 'Панірувальні сухарі', category: 'Крупи та макарони', quantity: 30, unit: 'g' })
    expect(normalizeImportedIngredient('Творог 20%', 180, 'g')).toEqual({ name: 'Кисломолочний сир', category: 'Молочні продукти', quantity: 180, unit: 'g' })
    expect(normalizeImportedIngredient('Свиняча вирізка', 170, 'g')).toEqual({ name: 'Свинина', category: 'М’ясо та птиця', quantity: 170, unit: 'g' })
  })

  it('preserves specific products when their names contain broader product terms', () => {
    expect(normalizeImportedIngredient('Кунжутна олія', 5, 'ml')).toEqual({ name: 'Кунжутна олія', category: 'Соуси та олії', quantity: 5, unit: 'ml' })
    expect(normalizeImportedIngredient('Зелена цибуля', 20, 'g')).toEqual({ name: 'Зелена цибуля', category: 'Овочі та зелень', quantity: 20, unit: 'g' })
    expect(normalizeImportedIngredient('Оцет рисовий', 10, 'ml')).toEqual({ name: 'Рисовий оцет', category: 'Соуси та олії', quantity: 10, unit: 'ml' })
    expect(normalizeImportedIngredient('Квасоля стручкова', 50, 'g')).toEqual({ name: 'Стручкова квасоля', category: 'Овочі та зелень', quantity: 50, unit: 'g' })
    expect(normalizeImportedIngredient('Грибна приправа натуральна', 2, 'g')).toEqual({ name: 'Грибна приправа', category: 'Спеції та зелень', quantity: 2, unit: 'g' })
    expect(normalizeImportedIngredient('Протеїн (ваніль)', 30, 'g')).toEqual({ name: 'Протеїн', category: 'Рослинний білок', quantity: 30, unit: 'g' })
    expect(normalizeImportedIngredient('Ванільний цукор', 8, 'g')).toEqual({ name: 'Ванільний цукор', category: 'Інше', quantity: 8, unit: 'g' })
    expect(normalizeImportedIngredient('Томатна паста без цукру', 20, 'g')).toEqual({ name: 'Томатна пасата', category: 'Соуси та олії', quantity: 20, unit: 'g' })
    expect(normalizeImportedIngredient('Оцет рисовий / яблучний', 10, 'ml')).toEqual({ name: 'Рисовий оцет', category: 'Соуси та олії', quantity: 10, unit: 'ml' })
    expect(normalizeImportedIngredient('Вода для кіноа', 100, 'ml')).toBeNull()
  })

  it('ignores OCR seasoning and layout fragments from the new books', () => {
    expect(normalizeImportedIngredient('Перецьчорний', 1, 'g')).toBeNull()
    expect(normalizeImportedIngredient('Спеції: сіль', 2, 'g')).toBeNull()
    expect(normalizeImportedIngredient('сире)', 1, 'g')).toBeNull()
  })
})
