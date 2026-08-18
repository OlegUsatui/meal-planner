import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ProductForm, type ProductFormValues } from '../components/ProductForm'
import { ArchiveProductDialog } from '../components/ArchiveProductDialog'
import { ProductRepositoryError } from '../repositories/product-repository'
import { useProductRepository } from '../repositories/useProductRepository'
import type { CreateProductInput, Product, UpdateProductInput } from '../types'
import { useOptionalAuth } from '../../auth/useAuth'
import { PermanentDeleteDialog } from '../../../shared/ui/PermanentDeleteDialog'
import { cacheTimes, queryKeys } from '../../../app/query/query-client'
import { invalidateProductData } from '../../../app/query/invalidation'
import { BackLink } from '../../../shared/ui/BackLink'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { Alert } from '../../../shared/ui/Alert'
import { Button } from '../../../shared/ui/Button'

export function ProductEditorPage() {
  const { productId } = useParams()
  const repository = useProductRepository()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string>()
  const [showArchive, setShowArchive] = useState(false)
  const archiveButtonRef = useRef<HTMLButtonElement>(null)
  const [showPermanentDelete, setShowPermanentDelete] = useState(false)
  const auth = useOptionalAuth()
  const userId = auth?.session?.user.id ?? 'test-session'
  const isAdmin = auth?.isAdmin ?? false
  const isCreate = !productId

  const productQuery = useQuery<Product>({
    queryKey: queryKeys.products(userId, { id: productId }),
    queryFn: ({ signal }) => repository.get(productId!, signal),
    staleTime: cacheTimes.catalogueStale,
    refetchOnWindowFocus: false,
    enabled: Boolean(productId),
  })

  const saveCreate = async (input: CreateProductInput) => {
    setSubmitError(undefined)
    try {
      await repository.create(input)
      await invalidateProductData(queryClient, userId)
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
      await invalidateProductData(queryClient, userId)
      navigate('/products', { replace: true })
    } catch (error: unknown) {
      setSubmitError(errorMessage(error))
    }
  }

  const archive = async () => {
    if (!productId) return
    try {
      await repository.archive(productId)
      await invalidateProductData(queryClient, userId)
      navigate('/products', { replace: true })
    } catch {
      setShowArchive(false)
      setSubmitError('Не вдалося архівувати продукт. Спробуйте ще раз.')
    }
  }

  const restore = async () => {
    if (!productId || !repository.restore) return
    try { await repository.restore(productId); await invalidateProductData(queryClient, userId); navigate('/products?archived=true', { replace: true }) }
    catch { setSubmitError('Не вдалося відновити продукт. Спробуйте ще раз.') }
  }

  const closeArchive = () => {
    setShowArchive(false)
    archiveButtonRef.current?.focus()
  }

  const removePermanently = async () => {
    if (!productId || !repository.remove) return
    try {
      await repository.remove(productId)
      await invalidateProductData(queryClient, userId)
      navigate('/products', { replace: true })
    } catch (error: unknown) {
      setShowPermanentDelete(false)
      setSubmitError(errorMessage(error))
    }
  }

  if (!isCreate && productQuery.isPending) {
    return <LoadingState>Завантажуємо продукт…</LoadingState>
  }
  if (!isCreate && productQuery.isError) {
    return <Alert variant="error" actions={<Button variant="secondary" onClick={() => void productQuery.refetch()}>Повторити</Button>}>Не вдалося завантажити продукт.</Alert>
  }

  const product = !isCreate ? productQuery.data : undefined
  if (product?.isSystem && !isAdmin) return <section className="page editor-page"><BackLink to="/products">До продуктів</BackLink><PageHeader className="editor-page-header" eyebrow="Системний каталог" title={product.name} description="Цей продукт входить до вбудованого каталогу й доступний усім користувачам. Його може змінювати лише адміністратор." /></section>
  return (
    <section className="page editor-page">
      <BackLink to="/products">До продуктів</BackLink>
      <PageHeader className="editor-page-header" eyebrow={isCreate ? 'Новий інгредієнт' : product?.category} title={isCreate ? 'Створити продукт' : product?.name} description="Вкажіть назву, категорію та одиницю, щоб використовувати продукт у рецептах." actions={product && <div className="editor-actions">{product.archivedAt && repository.restore && <Button variant="secondary" onClick={() => void restore()}>Відновити з архіву</Button>}{!product.archivedAt && <Button ref={archiveButtonRef} variant="danger-ghost" onClick={() => setShowArchive(true)}>Архівувати</Button>}{isAdmin && <Button variant="danger-ghost" onClick={() => setShowPermanentDelete(true)}>Видалити назавжди</Button>}</div>} />

      <div className="form-card">
        {isCreate ? (
          <ProductForm mode="create" onSubmit={saveCreate} submitError={submitError} />
        ) : product ? (
          <ProductForm mode="edit" onSubmit={saveEdit} submitError={submitError} isBaseUnitLocked={product.isBaseUnitLocked} initialValues={toFormValues(product)} />
        ) : null}
      </div>

      {showArchive && product && <ArchiveProductDialog product={product} onCancel={closeArchive} onConfirm={archive} />}
      {showPermanentDelete && product && <PermanentDeleteDialog name={product.name} entityLabel="продукт" onCancel={() => setShowPermanentDelete(false)} onConfirm={() => void removePermanently()} />}
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
    if (error.code === 'in-use') return error.message
    if (error.code === 'forbidden') return error.message
  }
  return 'Не вдалося зберегти продукт. Перевірте дані та спробуйте ще раз.'
}
