module.exports = (s, D) => s.define('ComplianceRule', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true }, rule_code: { type: D.STRING(50), allowNull: false },
  description: D.STRING(500), params: D.JSON, version: { type: D.INTEGER, allowNull: false, defaultValue: 1 },
  reviewed_by: D.STRING(100), effective_from: D.DATEONLY, is_active: { type: D.BOOLEAN, defaultValue: true },
}, { tableName: 'compliance_rules', timestamps: false, indexes: [{ unique: true, name: 'uq_rule', fields: ['rule_code','version'] }] });
