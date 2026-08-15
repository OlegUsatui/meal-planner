import { useState } from 'react'
import { recipeMealTypes, recipeSubcategories, type RecipeClassification, type RecipeMealType } from '../domain/recipe-taxonomy'

export function RecipeClassificationField({ value, onChange }: { value: RecipeClassification[]; onChange: (value: RecipeClassification[]) => void }) {
  const [mealType, setMealType] = useState<RecipeMealType>(value[0]?.mealType ?? 'breakfast')
  const categories = recipeSubcategories.filter((item) => item.mealType === mealType)
  const groups = [...new Set(categories.map((item) => item.group ?? recipeMealTypes.find((type) => type.value === mealType)?.label ?? 'Категорії'))]
  const checked = (classification: RecipeClassification) => value.some((item) => item.mealType === classification.mealType && item.subcategoryId === classification.subcategoryId)
  const toggle = (classification: RecipeClassification) => onChange(checked(classification) ? value.filter((item) => item.mealType !== classification.mealType || item.subcategoryId !== classification.subcategoryId) : [...value, { mealType: classification.mealType, subcategoryId: classification.subcategoryId }])

  return <fieldset className="recipe-classification-field"><legend>Категорії рецепту</legend><p className="field-hint">Спочатку виберіть прийом їжі, потім одну чи кілька релевантних підкатегорій.</p>
    <div className="classification-meal-types" aria-label="Прийом їжі">{recipeMealTypes.map((item) => <button type="button" key={item.value} aria-pressed={mealType === item.value} onClick={() => setMealType(item.value)}>{item.label}{value.some((entry) => entry.mealType === item.value) && <span aria-label="обрано"> · {value.filter((entry) => entry.mealType === item.value).length}</span>}</button>)}</div>
    <div className="classification-groups">{groups.map((group) => <section className="classification-subgroup" key={group}>{groups.length > 1 && <h3>{group}</h3>}<div>{categories.filter((item) => (item.group ?? recipeMealTypes.find((type) => type.value === mealType)?.label) === group).map((item) => <label className="classification-option" key={item.subcategoryId}><input type="checkbox" checked={checked(item)} onChange={() => toggle(item)} /><span>{item.label}</span></label>)}</div></section>)}</div>
  </fieldset>
}
