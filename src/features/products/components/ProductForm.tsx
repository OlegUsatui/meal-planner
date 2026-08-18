import { useState, type FormEvent } from 'react'
import { productCategories, validateProductInput, type BaseUnit, type ProductValidationErrors } from '../domain/product'
import type { CreateProductInput, UpdateProductInput } from '../types'
import { FormField } from '../../../shared/ui/FormField'
import { Alert } from '../../../shared/ui/Alert'
import { Button } from '../../../shared/ui/Button'

export interface ProductFormValues {
  name: string
  category: string
  baseUnit: BaseUnit
}

type ProductFormProps = {
  initialValues?: ProductFormValues
  isBaseUnitLocked?: boolean
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
    setPending(true)
    try {
      await props.onSubmit(values)
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
      <FormField id="product-base-unit" label="Базова одиниця" control={<select value={values.baseUnit} disabled={props.isBaseUnitLocked} onChange={(event) => update('baseUnit', event.target.value as BaseUnit)}>
          <option value="g">Грами (g)</option>
          <option value="ml">Мілілітри (ml)</option>
          <option value="pcs">Штуки (шт)</option>
        </select>} />
      {props.isBaseUnitLocked && <p className="field-hint">Одиницю вже не можна змінити, оскільки продукт використовується в рецептах.</p>}
      <div className="form-actions">
        <Button disabled={pending} type="submit" aria-busy={pending}>
          {pending ? 'Зберігаємо…' : props.mode === 'create' ? 'Створити продукт' : 'Зберегти зміни'}
        </Button>
      </div>
    </form>
  )
}
