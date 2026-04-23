import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

export const User = sequelize.define('users', {
  name: DataTypes.STRING,
  email: { type: DataTypes.STRING, unique: true },
  phone: DataTypes.STRING,
  role: { type: DataTypes.ENUM('client', 'architect', 'admin'), allowNull: false },
  password_hash: DataTypes.STRING,
  verification_code: DataTypes.STRING
});

export const Client = sequelize.define('clients', { created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW } }, { timestamps: false });
export const Architect = sequelize.define('architects', {
  CAU: { type: DataTypes.STRING, allowNull: false },
  tier_level: { type: DataTypes.INTEGER, defaultValue: 1, validate: { min: 1, max: 5 } },
  score: { type: DataTypes.INTEGER, defaultValue: 0 }
});
export const Product = sequelize.define('products', {
  name: DataTypes.STRING,
  code: { type: DataTypes.STRING, unique: true },
  category: DataTypes.STRING,
  price: DataTypes.DECIMAL(12, 2),
  description: DataTypes.TEXT,
  image_url: DataTypes.STRING,
  stock_quantity: { type: DataTypes.INTEGER, defaultValue: 0 }
});
export const Order = sequelize.define('orders', { created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }, status: DataTypes.STRING }, { timestamps: false });
export const OrderItem = sequelize.define('order_items', { quantity: DataTypes.INTEGER }, { timestamps: false });
export const Contract = sequelize.define('contracts', {
  contract_date: DataTypes.DATEONLY,
  start_date: DataTypes.DATEONLY,
  end_date: DataTypes.DATEONLY,
  status: DataTypes.STRING
}, { timestamps: false });
export const Payment = sequelize.define('payments', {
  amount: DataTypes.DECIMAL(12, 2),
  due_date: DataTypes.DATEONLY,
  percentage: DataTypes.DECIMAL(5, 2),
  status: { type: DataTypes.ENUM('paid', 'pending'), defaultValue: 'pending' }
}, { timestamps: false });
export const RtPayment = sequelize.define('rt_payments', {
  amount: DataTypes.DECIMAL(12, 2),
  type: { type: DataTypes.ENUM('full', 'parcelado'), defaultValue: 'parcelado' }
}, { timestamps: false });
export const Professional = sequelize.define('professionals', { name: DataTypes.STRING, profession: DataTypes.STRING }, { timestamps: false });
export const Equipment = sequelize.define('equipments', {
  name: DataTypes.STRING,
  type: DataTypes.STRING,
  status: { type: DataTypes.ENUM('available', 'in_use', 'maintenance'), defaultValue: 'available' }
}, { timestamps: false });
export const EquipmentHistory = sequelize.define('equipment_history', { action: DataTypes.STRING, date: DataTypes.DATE }, { timestamps: false });
export const Training = sequelize.define('trainings', { type: DataTypes.ENUM('technical', 'safety'), name: DataTypes.STRING }, { timestamps: false });
export const TrainingRecord = sequelize.define('training_records', {
  status: { type: DataTypes.ENUM('pending', 'completed'), defaultValue: 'pending' },
  date: DataTypes.DATE
}, { timestamps: false });
export const FinancialRecord = sequelize.define('financial_records', {
  type: DataTypes.ENUM('entrada', 'saída'),
  amount: DataTypes.DECIMAL(12, 2),
  description: DataTypes.STRING,
  date: DataTypes.DATE
}, { timestamps: false });
export const ActivityLog = sequelize.define('activity_logs', {
  action: DataTypes.STRING,
  module: DataTypes.STRING,
  payload: DataTypes.JSONB
}, { timestamps: true });

User.hasOne(Client, { foreignKey: 'user_id' }); Client.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(Architect, { foreignKey: 'user_id' }); Architect.belongsTo(User, { foreignKey: 'user_id' });
Client.belongsTo(Architect, { as: 'linkedArchitect', foreignKey: 'linked_architect_id' });
Order.belongsTo(Client, { foreignKey: 'client_id' });
Order.belongsTo(Architect, { foreignKey: 'architect_id' });
Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });
Contract.belongsTo(Client, { foreignKey: 'client_id' });
Contract.belongsTo(Architect, { foreignKey: 'architect_id' });
Contract.hasMany(Payment, { foreignKey: 'contract_id' });
Contract.hasMany(RtPayment, { foreignKey: 'contract_id' });
Equipment.belongsTo(Professional, { as: 'responsible', foreignKey: 'responsible_id' });
EquipmentHistory.belongsTo(Equipment, { foreignKey: 'equipment_id' });
EquipmentHistory.belongsTo(Professional, { as: 'responsible', foreignKey: 'responsible_id' });
TrainingRecord.belongsTo(Training, { foreignKey: 'training_id' });
TrainingRecord.belongsTo(Professional, { foreignKey: 'professional_id' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id' });

export { sequelize };
