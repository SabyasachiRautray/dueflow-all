module.exports = (s, D) => {
const AgentStep = s.define('AgentStep', {
  id: { type: D.BIGINT, primaryKey: true, autoIncrement: true }, run_id: { type: D.BIGINT, allowNull: false }, step_no: { type: D.INTEGER, allowNull: false },
  stage: { type: D.ENUM('ingest','classify','compute','plan','approve','execute','verify'), allowNull: false }, tool_name: D.STRING(80),
  input_json: D.JSON, output_json: D.JSON, reasoning: D.TEXT, status: { type: D.ENUM('success','retry','failed','skipped'), allowNull: false },
  retry_count: { type: D.TINYINT, defaultValue: 0 }, error: D.STRING(500), duration_ms: D.INTEGER, tokens_used: { type: D.INTEGER, defaultValue: 0 }, created_at: { type: D.DATE, defaultValue: D.NOW },
}, { tableName: 'agent_steps', timestamps: false, indexes: [{ unique: true, name: 'uq_run_step', fields: ['run_id','step_no'] }] });
AgentStep.associate = function (models) { AgentStep.belongsTo(models.AgentRun, { foreignKey: 'run_id' }); };
return AgentStep;
};
