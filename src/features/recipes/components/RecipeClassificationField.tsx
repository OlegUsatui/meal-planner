import { recipeMealTypes, recipeSubcategories, type RecipeClassification } from '../domain/recipe-taxonomy'

export function RecipeClassificationField({ value, onChange }: { value: RecipeClassification[]; onChange: (value: RecipeClassification[]) => void }) {
  const checked = (classification: RecipeClassification) => value.some((item) => item.mealType === classification.mealType && item.subcategoryId === classification.subcategoryId)
  const toggle = (classification: RecipeClassification) => onChange(checked(classification) ? value.filter((item) => item.mealType !== classification.mealType || item.subcategoryId !== classification.subcategoryId) : [...value, { mealType: classification.mealType, subcategoryId: classification.subcategoryId }])
  return <fieldset className="recipe-classification-field"><legend>Категорії рецепту</legend><p className="field-hint">Оберіть один або кілька розділів, у яких має з’являтися рецепт.</p><div className="classification-groups">{recipeMealTypes.map((mealType) => {
    const categories = recipeSubcategories.filter((item) => item.mealType === mealType.value)
    const groups = [...new Set(categories.map((item) => item.group ?? mealType.label))]
    return <section className="classification-meal" key={mealType.value}><h3>{mealType.label}</h3>{groups.map((group) => <div className="classification-subgroup" key={group}>{groups.length > 1 && <h4>{group}</h4>}<div>{categories.filter((item) => (item.group ?? mealType.label) === group).map((item) => <label className="classification-option" key={item.subcategoryId}><input type="checkbox" checked={checked(item)} onChange={() => toggle(item)} /><span>{item.label}</span></label>)}</div></div>)}</section>
  })}</div></fieldset>
}
