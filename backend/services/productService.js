import { store, nextId } from './dataStore.js';

export function listProducts({ q, category, minPrice, maxPrice }) {
  return store.products
    .filter((p) => (!q || p.name.toLowerCase().includes(String(q).toLowerCase())))
    .filter((p) => (!category || p.category === category))
    .filter((p) => (minPrice ? Number(p.price) >= Number(minPrice) : true))
    .filter((p) => (maxPrice ? Number(p.price) <= Number(maxPrice) : true))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function createProduct(payload) {
  const product = { id: nextId('products'), stock_quantity: 0, ...payload };
  store.products.push(product);
  return product;
}

export function adjustStock(id, delta) {
  const product = store.products.find((p) => p.id === Number(id));
  if (!product) return null;
  product.stock_quantity = Math.max(0, Number(product.stock_quantity || 0) + Number(delta || 0));
  return product;
}
