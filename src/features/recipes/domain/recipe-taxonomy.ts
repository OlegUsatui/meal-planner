export type RecipeMealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface RecipeClassification {
  mealType: RecipeMealType
  subcategoryId: string
}

export interface RecipeSubcategory extends RecipeClassification {
  label: string
  group?: string
}

export const recipeMealTypes: Array<{ value: RecipeMealType; label: string }> = [
  { value: 'breakfast', label: 'Сніданок' },
  { value: 'lunch', label: 'Обід' },
  { value: 'dinner', label: 'Вечеря' },
  { value: 'snack', label: 'Перекус' },
]

export const recipeSubcategories: RecipeSubcategory[] = [
  { mealType: 'breakfast', subcategoryId: 'breakfast-eggs', label: 'Сніданки з яєць', group: 'Солоні сніданки' },
  { mealType: 'breakfast', subcategoryId: 'breakfast-hearty-grains', label: 'Ситні зернові сніданки', group: 'Солоні сніданки' },
  { mealType: 'breakfast', subcategoryId: 'breakfast-bread', label: 'Хлібні сніданки', group: 'Солоні сніданки' },
  { mealType: 'breakfast', subcategoryId: 'breakfast-street-style', label: 'Street-style сніданки', group: 'Солоні сніданки' },
  { mealType: 'breakfast', subcategoryId: 'breakfast-quick', label: 'Швидкі та прості сніданки', group: 'Солоні сніданки' },
  { mealType: 'breakfast', subcategoryId: 'breakfast-healthy-plates', label: 'Здорові сніданкові тарілки', group: 'Солоні сніданки' },
  { mealType: 'breakfast', subcategoryId: 'breakfast-world', label: 'Національні сніданки світу', group: 'Солоні сніданки' },
  { mealType: 'breakfast', subcategoryId: 'breakfast-classic-sweet', label: 'Класичні солодкі сніданки', group: 'Солодкі сніданки' },
  { mealType: 'breakfast', subcategoryId: 'breakfast-sweet-plates', label: 'Солодкі сніданкові тарілки', group: 'Солодкі сніданки' },
  { mealType: 'breakfast', subcategoryId: 'breakfast-balanced-desserts', label: 'Десертні, але збалансовані', group: 'Солодкі сніданки' },
  { mealType: 'breakfast', subcategoryId: 'breakfast-in-a-jar', label: 'Сніданок у банці', group: 'Солодкі сніданки' },
  { mealType: 'lunch', subcategoryId: 'lunch-chicken-turkey', label: 'Курка та індичка: ситно й легко' },
  { mealType: 'lunch', subcategoryId: 'lunch-beef-veal', label: 'Яловичина та телятина' },
  { mealType: 'lunch', subcategoryId: 'lunch-fish-seafood', label: 'Риба та морепродукти' },
  { mealType: 'lunch', subcategoryId: 'lunch-wok', label: 'Wok-обіди' },
  { mealType: 'lunch', subcategoryId: 'lunch-vegetarian-protein', label: 'Вегетаріанські білкові' },
  { mealType: 'lunch', subcategoryId: 'lunch-legumes-grains', label: 'Бобові та зернові як основа' },
  { mealType: 'lunch', subcategoryId: 'lunch-salad-bowls', label: 'Салати-боули' },
  { mealType: 'lunch', subcategoryId: 'lunch-protein-soups', label: 'Білкові супи' },
  { mealType: 'lunch', subcategoryId: 'lunch-cream-soups', label: 'Крем-супи + білок' },
  { mealType: 'lunch', subcategoryId: 'lunch-mediterranean-cafe', label: 'Середземноморські та «кафешні»' },
  { mealType: 'lunch', subcategoryId: 'lunch-vegetable-casseroles', label: 'Овочеві запіканки з білком' },
  { mealType: 'lunch', subcategoryId: 'lunch-pasta-noodles', label: 'Паста й локшина з білком' },
  { mealType: 'lunch', subcategoryId: 'lunch-hearty-baked', label: 'Ситні запечені обіди' },
  { mealType: 'dinner', subcategoryId: 'dinner-fish', label: 'Рибні страви' },
  { mealType: 'dinner', subcategoryId: 'dinner-poultry-protein', label: 'Білкові вечері з птиці' },
  { mealType: 'dinner', subcategoryId: 'dinner-red-meat', label: 'Страви з червоного м’яса' },
  { mealType: 'dinner', subcategoryId: 'dinner-vegetarian', label: 'Вегетаріанські вечері' },
  { mealType: 'dinner', subcategoryId: 'dinner-legumes', label: 'Бобові страви' },
  { mealType: 'dinner', subcategoryId: 'dinner-eggs-cheese', label: 'Яєчні та сирні вечері' },
  { mealType: 'dinner', subcategoryId: 'dinner-complete-plate', label: 'Повноцінна тарілка' },
  { mealType: 'dinner', subcategoryId: 'dinner-light-vegetables', label: 'Легкі вечері з овочами' },
  { mealType: 'dinner', subcategoryId: 'dinner-soups-stews', label: 'Супи та рагу' },
  { mealType: 'dinner', subcategoryId: 'dinner-mixed', label: 'Вечері у різних поєднаннях' },
  { mealType: 'dinner', subcategoryId: 'dinner-cutlets-meatballs', label: 'Котлетки та фрикадельки' },
  { mealType: 'snack', subcategoryId: 'snack-general', label: 'Перекуси' },
]

export function isValidRecipeClassification(value: RecipeClassification): boolean {
  return recipeSubcategories.some((item) => item.mealType === value.mealType && item.subcategoryId === value.subcategoryId)
}

export function uniqueClassifications(values: RecipeClassification[]): RecipeClassification[] {
  const seen = new Set<string>()
  return values.filter((value) => { const key = `${value.mealType}:${value.subcategoryId}`; if (seen.has(key)) return false; seen.add(key); return true })
}

export function getRecipeSubcategory(id: string): RecipeSubcategory | undefined {
  return recipeSubcategories.find((item) => item.subcategoryId === id)
}

export function recipeAvailableForMealType(classifications: RecipeClassification[], mealType: RecipeMealType): boolean {
  return classifications.length === 0 || classifications.some((item) => item.mealType === mealType)
}
