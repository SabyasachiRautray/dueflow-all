module.exports = (s, D) => {
const AuditLog = s.define('AuditLog', {
  id: { type: D.BIGINT, primaryKey: true, autoIncrement: true }, org_id: { type: D.INTEGER, allowNull: false }, actor_type: { type: D.ENUM('user','agent','system'), allowNull: false },
  actor_id: D.INTEGER, action: { type: D.STRING(80), allowNull: false }, entity_type: D.STRING(50), entity_id: D.BIGINT, details: D.JSON, created_at: { type: D.DATE, defaultValue: D.NOW },
}, { tableName: 'audit_logs', timestamps: false, indexes: [{ name: 'idx_audit', fields: ['org_id','entity_type','entity_id'] }] });
AuditLog.associate = function (models) { AuditLog.belongsTo(models.Organization, { foreignKey: 'org_id' }); };
return AuditLog;
};
