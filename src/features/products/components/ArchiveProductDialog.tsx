import type { Product } from '../types'
import { Dialog } from '../../../shared/ui/Dialog'
import { Button } from '../../../shared/ui/Button'

export function ArchiveProductDialog({ product, onCancel, onConfirm }: { product: Product; onCancel: () => void; onConfirm: () => void }) {
  return <Dialog eyebrow="Без видалення історії" title={`Архівувати «${product.name}»?`} titleId="archive-title" onClose={onCancel} actions={<><Button variant="secondary" onClick={onCancel}>Скасувати</Button><Button variant="danger" onClick={onConfirm}>Архівувати</Button></>}><p>Продукт зникне з нових рецептів, але залишиться доступним у вже збережених рецептах.</p><div className="archive-impact"><span>Рецептів: <strong>{product.recipeUsageCount}</strong></span></div></Dialog>
}
