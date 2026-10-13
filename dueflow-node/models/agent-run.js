module.exports = (s, D) => {
const AgentRun = s.define('AgentRun', {
  id: { type: D.BIGINT, primaryKey: true, autoIncrement: true }, org_id: { type: D.INTEGER, allowNull: false }, triggered_by: D.INTEGER,
  goal: D.STRING(500), weekly_budget: { type: D.DECIMAL(14,2), allowNull: false },
  status: { type: D.ENUM('running','awaiting_approval','completed','failed','cancelled'), defaultValue: 'running' },
  started_at: { type: D.DATE, defaultValue: D.NOW }, finished_at: D.DATE,
}, { tableName: 'agent_runs', timestamps: false });
AgentRun.associate = function (models) {
  AgentRun.belongsTo(models.Organization, { foreignKey: 'org_id' });
  AgentRun.belongsTo(models.User, { foreignKey: 'triggered_by', as: 'triggeringUser' });
  AgentRun.hasMany(models.AgentStep, { foreignKey: 'run_id', as: 'steps', onDelete: 'CASCADE' });
  AgentRun.hasMany(models.PaymentPlan, { foreignKey: 'run_id', as: 'paymentPlans', onDelete: 'CASCADE' });
};
return AgentRun;
};
