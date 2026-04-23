import { Router } from 'express';
import { login, register } from '../controllers/authController.js';
import { listProductsHandler, createProductHandler, adjustStockHandler } from '../controllers/catalogController.js';
import { createOrderHandler } from '../controllers/orderController.js';
import { dashboard } from '../controllers/adminController.js';
import { architectDashboard } from '../controllers/architectController.js';
import { createContractHandler } from '../controllers/contractController.js';
import { createEquipmentHandler, updateEquipmentHandler, recordTrainingHandler } from '../controllers/operationsController.js';
import { createFinancialRecordHandler, exportReport } from '../controllers/financialController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { logActivity } from '../middlewares/activityLog.js';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);

router.get('/products', listProductsHandler);
router.post('/products', protect, authorize('admin'), logActivity('inventory', 'create_product'), createProductHandler);
router.patch('/products/:id/stock', protect, authorize('admin'), logActivity('inventory', 'adjust_stock'), adjustStockHandler);

router.post('/orders', protect, authorize('client', 'admin'), logActivity('sales', 'create_order'), createOrderHandler);
router.get('/admin/dashboard', protect, authorize('admin'), dashboard);
router.get('/architect/dashboard', protect, authorize('architect'), architectDashboard);
router.post('/contracts', protect, authorize('admin'), logActivity('contracts', 'create_contract'), createContractHandler);
router.post('/financial-records', protect, authorize('admin'), createFinancialRecordHandler);
router.get('/reports/export', protect, authorize('admin'), exportReport);

router.post('/equipments', protect, authorize('admin'), createEquipmentHandler);
router.patch('/equipments/:id', protect, authorize('admin'), updateEquipmentHandler);
router.post('/training-records', protect, authorize('admin'), recordTrainingHandler);

export default router;
