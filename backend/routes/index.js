import { Router } from 'express';
import { login, register } from '../controllers/authController.js';
import { listProducts, createProduct, adjustStock } from '../controllers/catalogController.js';
import { createOrder } from '../controllers/orderController.js';
import { dashboard } from '../controllers/adminController.js';
import { architectDashboard } from '../controllers/architectController.js';
import { createContract } from '../controllers/contractController.js';
import { createEquipment, updateEquipment, recordTraining } from '../controllers/operationsController.js';
import { createFinancialRecord, exportReport } from '../controllers/financialController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { logActivity } from '../middlewares/activityLog.js';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);

router.get('/products', listProducts);
router.post('/products', protect, authorize('admin'), logActivity('inventory', 'create_product'), createProduct);
router.patch('/products/:id/stock', protect, authorize('admin'), logActivity('inventory', 'adjust_stock'), adjustStock);

router.post('/orders', protect, authorize('client', 'admin'), logActivity('sales', 'create_order'), createOrder);
router.get('/admin/dashboard', protect, authorize('admin'), dashboard);
router.get('/architect/dashboard', protect, authorize('architect'), architectDashboard);
router.post('/contracts', protect, authorize('admin'), logActivity('contracts', 'create_contract'), createContract);
router.post('/financial-records', protect, authorize('admin'), createFinancialRecord);
router.get('/reports/export', protect, authorize('admin'), exportReport);

router.post('/equipments', protect, authorize('admin'), createEquipment);
router.patch('/equipments/:id', protect, authorize('admin'), updateEquipment);
router.post('/training-records', protect, authorize('admin'), recordTraining);

export default router;
