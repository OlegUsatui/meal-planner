import { cloneElement, useState, type FormEvent, type HTMLAttributes, type ReactElement } from 'react'
import { productCategories, validateProductInput, type BaseUnit, type ProductValidationErrors } from '../domain/product'
import type { CreateProductInput, UpdateProductInput } from '../types'

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
      {props.submitError && <div className="form-alert" role="alert">{props.submitError}</div>}
      <Field label="Назва продукту" error={errors.name}>
        <input value={values.name} onChange={(event) => update('name', event.target.value)} autoComplete="off" />
      </Field>
      <Field label="Категорія" error={errors.category}>
        <select value={values.category} onChange={(event) => update('category', event.target.value)}>
          <option value="">Оберіть категорію</option>
          {values.category && !productCategories.includes(values.category as typeof productCategories[number]) && <option value={values.category}>{values.category} (застаріла категорія — оберіть нову)</option>}
          {productCategories.map((category) => <option key={category}>{category}</option>)}
        </select>
      </Field>
      <Field label="Базова одиниця">
        <select value={values.baseUnit} disabled={props.isBaseUnitLocked} onChange={(event) => update('baseUnit', event.target.value as BaseUnit)}>
          <option value="g">Грами (g)</option>
          <option value="ml">Мілілітри (ml)</option>
          <option value="pcs">Штуки (шт)</option>
        </select>
      </Field>
      {props.isBaseUnitLocked && <p className="field-hint">Одиницю вже не можна змінити, оскільки продукт використовується в рецептах.</p>}
      <div className="form-actions">
        <button className="button button-primary" disabled={pending} type="submit" aria-busy={pending}>
          {pending ? 'Зберігаємо…' : props.mode === 'create' ? 'Створити продукт' : 'Зберегти зміни'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactElement }) {
  const id = `field-${label.toLocaleLowerCase('uk-UA').replace(/[^a-zа-яіїєґ0-9]+/giu, '-')}`
  return (
    <div className={`field ${error ? 'field-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {cloneWithId(children, id, error ? `${id}-error` : undefined)}
      {error && <p id={`${id}-error`} className="field-error-text">{error}</p>}
    </div>
  )
}

function cloneWithId(element: ReactElement, id: string, describedBy?: string) {
  return cloneElement(element, { id, 'aria-describedby': describedBy, 'aria-invalid': Boolean(describedBy) } as HTMLAttributes<HTMLElement>)
}
