import { adjustStock, createProduct, listProducts } from '../services/productService.js';

export async function listProductsHandler(req, res) {
  res.json(listProducts(req.query));
}

export async function createProductHandler(req, res) {
  const product = createProduct(req.body);
  if (req.logActivity) await req.logActivity({ productId: product.id });
  res.status(201).json(product);
}

export async function adjustStockHandler(req, res) {
  const product = adjustStock(req.params.id, req.body.delta);
  if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
  if (req.logActivity) await req.logActivity({ productId: product.id, delta: req.body.delta });
  return res.json(product);
}
