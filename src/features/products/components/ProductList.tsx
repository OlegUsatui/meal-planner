import { Link } from 'react-router-dom'
import type { Product } from '../types'

export function ProductList({ products }: { products: Product[] }) {
  return (
    <>
      <div className="product-table-wrap">
        <table className="product-table">
          <thead><tr><th>Продукт</th><th>Одиниця</th><th><span className="sr-only">Дії</span></th></tr></thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td><strong>{product.name}</strong><span>{product.category}</span>{product.isSystem && <span className="badge">Системний</span>}{product.archivedAt && <span className="badge">Архів</span>}</td>
                <td>{unitLabel(product.baseUnit)}</td>
                <td><Link className="row-link" to={`/products/${product.id}`}>Відкрити<span className="sr-only"> {product.name}</span></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="product-cards">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <div><p className="eyebrow">{product.category}</p><h2>{product.name}</h2></div>
            <dl><div><dt>Одиниця</dt><dd>{unitLabel(product.baseUnit)}</dd></div><div><dt>Рецептів</dt><dd>{product.recipeUsageCount}</dd></div></dl>
            <Link className="button button-secondary" to={`/products/${product.id}`}>Відкрити</Link>
          </article>
        ))}
      </div>
    </>
  )
}

function unitLabel(unit: Product['baseUnit']): string {
  return unit === 'pcs' ? 'шт' : unit
}
