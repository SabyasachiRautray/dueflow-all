module.exports = (s, D) => {
const AgentMemory = s.define('AgentMemory', {
  id: { type: D.BIGINT, primaryKey: true, autoIncrement: true }, org_id: { type: D.INTEGER, allowNull: false }, vendor_id: D.INTEGER,
  memory_key: { type: D.STRING(100), allowNull: false }, memory_value: D.JSON,
  updated_at: { type: D.DATE, defaultValue: D.NOW },
}, { tableName: 'agent_memory', timestamps: false, indexes: [{ unique: true, name: 'uq_mem', fields: ['org_id','vendor_id','memory_key'] }] });
AgentMemory.associate = function (models) {
  AgentMemory.belongsTo(models.Organization, { foreignKey: 'org_id' });
  AgentMemory.belongsTo(models.Vendor, { foreignKey: 'vendor_id', constraints: false });
};
return AgentMemory;
};
