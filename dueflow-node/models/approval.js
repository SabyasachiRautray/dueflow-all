module.exports = (s, D) => {
const Approval = s.define('Approval', {
  id: { type: D.BIGINT, primaryKey: true, autoIncrement: true }, plan_id: { type: D.BIGINT, allowNull: false }, approver_id: { type: D.INTEGER, allowNull: false },
  decision: { type: D.ENUM('approved','rejected','changes_requested'), allowNull: false }, comment: D.STRING(500), decided_at: { type: D.DATE, defaultValue: D.NOW },
}, { tableName: 'approvals', timestamps: false });
Approval.associate = function (models) {
  Approval.belongsTo(models.PaymentPlan, { foreignKey: 'plan_id' });
  Approval.belongsTo(models.User, { foreignKey: 'approver_id', as: 'approver' });
};
return Approval;
};
