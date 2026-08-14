import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductForm, type ProductFormValues } from '../components/ProductForm'
import { ArchiveProductDialog } from '../components/ArchiveProductDialog'
import { ProductRepositoryError } from '../repositories/product-repository'
import { useProductRepository } from '../repositories/useProductRepository'
import type { CreateProductInput, Product, UpdateProductInput } from '../types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; product: Product }

export function ProductEditorPage() {
  const { productId } = useParams()
  const repository = useProductRepository()
  const navigate = useNavigate()
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [submitError, setSubmitError] = useState<string>()
  const [showArchive, setShowArchive] = useState(false)
  const archiveButtonRef = useRef<HTMLButtonElement>(null)
  const isCreate = !productId

  useEffect(() => {
    if (!productId) return
    let active = true
    repository
      .get(productId)
      .then((product) => active && setLoadState({ status: 'ready', product }))
      .catch(() => active && setLoadState({ status: 'error', message: 'Не вдалося завантажити продукт' }))
    return () => { active = false }
  }, [productId, repository])

  const saveCreate = async (input: CreateProductInput) => {
    setSubmitError(undefined)
    try {
      await repository.create(input)
      navigate('/products', { replace: true })
    } catch (error: unknown) {
      setSubmitError(errorMessage(error))
    }
  }

  const saveEdit = async (input: UpdateProductInput) => {
    if (!productId) return
    setSubmitError(undefined)
    try {
      await repository.update(productId, input)
      navigate('/products', { replace: true })
    } catch (error: unknown) {
      setSubmitError(errorMessage(error))
    }
  }

  const archive = async () => {
    if (!productId) return
    try {
      await repository.archive(productId)
      navigate('/products', { replace: true })
    } catch {
      setShowArchive(false)
      setSubmitError('Не вдалося архівувати продукт. Спробуйте ще раз.')
    }
  }

  const closeArchive = () => {
    setShowArchive(false)
    archiveButtonRef.current?.focus()
  }

  if (!isCreate && loadState.status === 'loading') {
    return <div className="loading-panel" aria-live="polite">Завантажуємо продукт…</div>
  }
  if (!isCreate && loadState.status === 'error') {
    return <div className="form-alert" role="alert">{loadState.message}</div>
  }

  const product = !isCreate && loadState.status === 'ready' ? loadState.product : undefined
  if (product?.isSystem) return <section className="page editor-page"><Link className="back-link" to="/products">← До продуктів</Link><header className="editor-header"><div><p className="eyebrow">Системний каталог</p><h1>{product.name}</h1><p className="page-intro">Цей продукт входить до вбудованого каталогу й доступний усім користувачам. Його не можна редагувати або архівувати.</p></div></header></section>
  return (
    <section className="page editor-page">
      <Link className="back-link" to="/products">← До продуктів</Link>
      <header className="editor-header">
        <div>
          <p className="eyebrow">{isCreate ? 'Новий інгредієнт' : product?.category}</p>
          <h1>{isCreate ? 'Створити продукт' : product?.name}</h1>
        <p className="page-intro">Вкажіть назву, категорію та одиницю, щоб використовувати продукт у рецептах.</p>
        </div>
        {product && !product.archivedAt && <button ref={archiveButtonRef} className="button button-danger-ghost" onClick={() => setShowArchive(true)}>Архівувати</button>}
      </header>

      <div className="form-card">
        {isCreate ? (
          <ProductForm mode="create" onSubmit={saveCreate} submitError={submitError} />
        ) : product ? (
          <ProductForm mode="edit" onSubmit={saveEdit} submitError={submitError} isBaseUnitLocked={product.isBaseUnitLocked} initialValues={toFormValues(product)} />
        ) : null}
      </div>

      {showArchive && product && <ArchiveProductDialog product={product} onCancel={closeArchive} onConfirm={archive} />}
    </section>
  )
}

function toFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    category: product.category,
    baseUnit: product.baseUnit,
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof ProductRepositoryError) {
    if (error.code === 'duplicate-name') return 'Продукт із такою назвою вже існує.'
    if (error.code === 'base-unit-locked') return 'Базову одиницю вже не можна змінити.'
  }
  return 'Не вдалося зберегти продукт. Перевірте дані та спробуйте ще раз.'
}
