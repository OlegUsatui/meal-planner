import { Link } from 'react-router-dom'

export function DashboardPage() {
  return (
    <section className="page dashboard-page">
      <header className="dashboard-hero">
        <div>
          <p className="eyebrow">Ваш простір для планування</p>
          <h1>Менше думати.<br />Смачніше готувати.</h1>
          <p>Почніть із продуктів — вони стануть основою рецептів, плану та списку покупок.</p>
          <div className="hero-actions"><Link className="button button-primary" to="/products/new">Створити продукт</Link><Link className="button button-secondary" to="/products">Відкрити каталог</Link></div>
        </div>
        <div className="hero-visual" aria-hidden="true"><div className="food-bowl"><span className="leaf leaf-one" /><span className="leaf leaf-two" /><span className="tomato tomato-one" /><span className="tomato tomato-two" /><span className="grain" /></div><span className="hero-caption">Ваш план починається тут</span></div>
      </header>
      <div className="setup-section">
        <div className="section-heading"><div><p className="eyebrow">Перший маршрут</p><h2>Від продукту до готового плану</h2></div><span className="progress-pill">1 з 4 доступно</span></div>
        <div className="setup-grid">
          <Link className="setup-card available" to="/products"><span className="setup-number">01</span><div><h3>Продукти</h3><p>Додайте назву, категорію та одиницю.</p></div><span className="card-arrow">→</span></Link>
          <article className="setup-card"><span className="setup-number">02</span><div><h3>Рецепти</h3><p>Зберіть продукти у страви та порції.</p></div></article>
          <article className="setup-card"><span className="setup-number">03</span><div><h3>Календар</h3><p>Розкладіть страви на потрібні дні.</p></div></article>
          <article className="setup-card"><span className="setup-number">04</span><div><h3>Покупки</h3><p>Отримайте точний список того, чого бракує.</p></div></article>
        </div>
      </div>
    </section>
  )
}
