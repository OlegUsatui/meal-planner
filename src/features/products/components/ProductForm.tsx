import { useState, type FormEvent } from 'react'
import { productCategories, validateProductInput, type BaseUnit, type ProductValidationErrors } from '../domain/product'
import type { CreateProductInput, UpdateProductInput } from '../types'
import { FormField } from '../../../shared/ui/FormField'
import { Alert } from '../../../shared/ui/Alert'
import { Button } from '../../../shared/ui/Button'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'

export interface ProductFormValues {
  name: string
  category: string
  baseUnit: BaseUnit
}

type ProductFormProps = {
  initialValues?: ProductFormValues
  recipeUsageCount?: number
  submitError?: string
} & (
  | { mode: 'create'; onSubmit: (value: CreateProductInput) => Promise<void> }
  | { mode: 'edit'; onSubmit: (value: UpdateProductInput) => Promise<void> }
)

const defaults: ProductFormValues = { name: '', category: '', baseUnit: 'g' }

export function ProductForm(props: ProductFormProps) {
  const [values, setValues] = useState(props.initialValues ?? defaults)
  const [errors, setErrors] = useState<ProductValidationErrors>({})
  const [pending, setPending] = useState(false)
  const [confirmingUnitChange, setConfirmingUnitChange] = useState(false)

  const update = (field: keyof ProductFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateProductInput(values)
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    if (props.mode === 'edit' && (props.recipeUsageCount ?? 0) > 0 && values.baseUnit !== props.initialValues?.baseUnit) {
      setConfirmingUnitChange(true)
      return
    }
    await save(values)
  }

  const save = async (nextValues: ProductFormValues) => {
    setPending(true)
    try {
      await props.onSubmit(nextValues)
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="product-form" noValidate onSubmit={submit}>
      {props.submitError && <Alert variant="error">{props.submitError}</Alert>}
      <FormField id="product-name" label="Назва продукту" error={errors.name} control={<input value={values.name} onChange={(event) => update('name', event.target.value)} autoComplete="off" />} />
      <FormField id="product-category" label="Категорія" error={errors.category} control={<select value={values.category} onChange={(event) => update('category', event.target.value)}>
          <option value="">Оберіть категорію</option>
          {values.category && !productCategories.includes(values.category as typeof productCategories[number]) && <option value={values.category}>{values.category} (застаріла категорія — оберіть нову)</option>}
          {productCategories.map((category) => <option key={category}>{category}</option>)}
        </select>} />
      <FormField id="product-base-unit" label="Базова одиниця" control={<select value={values.baseUnit} onChange={(event) => update('baseUnit', event.target.value as BaseUnit)}>
          <option value="g">Грами (g)</option>
          <option value="ml">Мілілітри (ml)</option>
          <option value="pcs">Штуки (шт)</option>
        </select>} />
      {props.mode === 'edit' && (props.recipeUsageCount ?? 0) > 0 && <p className="field-hint">Якщо змінити одиницю, вона оновиться в усіх пов’язаних рецептах без зміни числових значень.</p>}
      <div className="form-actions">
        <Button disabled={pending} type="submit" aria-busy={pending}>
          {pending ? 'Зберігаємо…' : props.mode === 'create' ? 'Створити продукт' : 'Зберегти зміни'}
        </Button>
      </div>
      {confirmingUnitChange && props.mode === 'edit' && <ConfirmDialog
        title="Змінити базову одиницю?"
        description={`Продукт використовується у ${props.recipeUsageCount} ${recipeWord(props.recipeUsageCount ?? 0)}. Числа залишаться без змін, але одиниця зміниться всюди. Наприклад: 500 ${unitLabel(props.initialValues?.baseUnit)} → 500 ${unitLabel(values.baseUnit)}.`}
        confirmLabel="Змінити одиницю"
        pending={pending}
        onCancel={() => setConfirmingUnitChange(false)}
        onConfirm={() => { setConfirmingUnitChange(false); void save(values) }}
      />}
    </form>
  )
}

function recipeWord(count: number): string {
  if (count % 10 === 1 && count % 100 !== 11) return 'рецепті'
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'рецептах'
  return 'рецептах'
}

function unitLabel(unit: BaseUnit | undefined): string {
  if (unit === 'ml') return 'мл'
  if (unit === 'pcs') return 'шт'
  return 'г'
}
