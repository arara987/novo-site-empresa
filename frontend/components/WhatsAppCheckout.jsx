import { useState } from 'react';

const WHATSAPP_NUMBER = '5500000000000';

export default function WhatsAppCheckout({ products }) {
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', produto: '', codigo: '', quantidade: 1, observacoes: '', arquiteto: '' });

  function finalizeOrder() {
    const msg = `Nome: ${form.nome}\nTelefone: ${form.telefone}\nEmail: ${form.email}\nProduto: ${form.produto}\nCódigo: ${form.codigo}\nQuantidade: ${form.quantidade}\nObservações: ${form.observacoes}\nOrigem: Site\nArquiteto: ${form.arquiteto}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  return (
    <section className="panel">
      <h2>Checkout via WhatsApp</h2>
      <div className="form-grid">
        {Object.keys(form).map((k) => (
          <input
            key={k}
            placeholder={k}
            value={form[k]}
            onChange={(e) => setForm((s) => ({ ...s, [k]: e.target.value }))}
            list={k === 'produto' ? 'products' : undefined}
          />
        ))}
        <datalist id="products">{products.map((p) => <option key={p.id} value={p.name} />)}</datalist>
      </div>
      <button className="cta" onClick={finalizeOrder}>Finalize Order</button>
    </section>
  );
}
