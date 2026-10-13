module.exports = (s, D) => {
const PaymentPlan = s.define('PaymentPlan', {
  id: { type: D.BIGINT, primaryKey: true, autoIncrement: true }, run_id: { type: D.BIGINT, allowNull: false },
  total_amount: { type: D.DECIMAL(14,2), allowNull: false }, budget_left: { type: D.DECIMAL(14,2), allowNull: false }, summary: D.TEXT,
  status: { type: D.ENUM('draft','pending_approval','approved','rejected','executed'), defaultValue: 'draft' }, created_at: { type: D.DATE, defaultValue: D.NOW },
}, { tableName: 'payment_plans', timestamps: false });
PaymentPlan.associate = function (models) {
  PaymentPlan.belongsTo(models.AgentRun, { foreignKey: 'run_id' });
  PaymentPlan.hasMany(models.PlanItem, { foreignKey: 'plan_id', as: 'items', onDelete: 'CASCADE' });
  PaymentPlan.hasMany(models.Approval, { foreignKey: 'plan_id', as: 'approvals' });
};
return PaymentPlan;
};
