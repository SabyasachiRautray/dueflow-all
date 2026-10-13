module.exports = (s, D) => {
const PlanItem = s.define('PlanItem', {
  id: { type: D.BIGINT, primaryKey: true, autoIncrement: true }, plan_id: { type: D.BIGINT, allowNull: false }, invoice_id: { type: D.BIGINT, allowNull: false },
  pay_amount: { type: D.DECIMAL(14,2), allowNull: false }, priority: { type: D.INTEGER, allowNull: false }, reason: D.STRING(500),
  decision: { type: D.ENUM('pending','approved','rejected','deferred'), defaultValue: 'pending' },
}, { tableName: 'plan_items', timestamps: false, indexes: [{ unique: true, name: 'uq_plan_invoice', fields: ['plan_id','invoice_id'] }] });
PlanItem.associate = function (models) {
  PlanItem.belongsTo(models.PaymentPlan, { foreignKey: 'plan_id' });
  PlanItem.belongsTo(models.Invoice, { foreignKey: 'invoice_id' });
  PlanItem.hasMany(models.Payment, { foreignKey: 'plan_item_id', as: 'payments' });
};
return PlanItem;
};
