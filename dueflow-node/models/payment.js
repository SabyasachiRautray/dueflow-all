module.exports = (s, D) => {
const Payment = s.define('Payment', {
  id: { type: D.BIGINT, primaryKey: true, autoIncrement: true }, plan_item_id: { type: D.BIGINT, allowNull: false }, invoice_id: { type: D.BIGINT, allowNull: false },
  amount: { type: D.DECIMAL(14,2), allowNull: false }, idempotency_key: { type: D.STRING(80), allowNull: false, unique: true }, gateway_ref: D.STRING(100),
  status: { type: D.ENUM('initiated','success','failed'), defaultValue: 'initiated' }, paid_at: D.DATE, created_at: { type: D.DATE, defaultValue: D.NOW },
}, { tableName: 'payments', timestamps: false });
Payment.associate = function (models) {
  Payment.belongsTo(models.PlanItem, { foreignKey: 'plan_item_id' });
  Payment.belongsTo(models.Invoice, { foreignKey: 'invoice_id' });
};
return Payment;
};
