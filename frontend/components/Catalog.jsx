import { useMemo, useState } from 'react';

export default function Catalog({ products }) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const filtered = useMemo(() => products.filter((p) =>
    (!q || p.name.toLowerCase().includes(q.toLowerCase())) &&
    (!category || p.category === category)
  ), [products, q, category]);

  return (
    <section className="panel">
      <h2>Catálogo Premium</h2>
      <div className="filters">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas categorias</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => { setQ(''); setCategory(''); }}>Reset</button>
      </div>
      <div className="grid">
        {filtered.map((p) => <article key={p.id} className="card"><h3>{p.name}</h3><p>{p.description}</p><strong>R$ {Number(p.price).toFixed(2)}</strong></article>)}
      </div>
    </section>
  );
}
