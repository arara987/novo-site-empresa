import { Op } from 'sequelize';
import { Product } from '../models/index.js';

export async function listProducts(req, res) {
  const { q, category, minPrice, maxPrice } = req.query;
  const where = {};
  if (q) where.name = { [Op.iLike]: `%${q}%` };
  if (category) where.category = category;
  if (minPrice || maxPrice) where.price = { ...(minPrice && { [Op.gte]: minPrice }), ...(maxPrice && { [Op.lte]: maxPrice }) };
  const products = await Product.findAll({ where, order: [['name', 'ASC']] });
  res.json(products);
}

export async function createProduct(req, res) {
  const product = await Product.create(req.body);
  if (req.logActivity) await req.logActivity({ productId: product.id });
  res.status(201).json(product);
}

export async function adjustStock(req, res) {
  const { id } = req.params;
  const { delta } = req.body;
  const product = await Product.findByPk(id);
  if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
  product.stock_quantity = Math.max(0, product.stock_quantity + Number(delta));
  await product.save();
  if (req.logActivity) await req.logActivity({ productId: product.id, delta });
  res.json(product);
}
