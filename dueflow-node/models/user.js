module.exports = (s, D) => {
const User = s.define('User', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true }, org_id: { type: D.INTEGER, allowNull: false },
  name: { type: D.STRING(100), allowNull: false }, email: { type: D.STRING(150), allowNull: false, unique: true },
  password_hash: { type: D.STRING(255), allowNull: false }, role: { type: D.ENUM('admin','approver','viewer'), defaultValue: 'viewer' },
  created_at: { type: D.DATE, defaultValue: D.NOW },
}, { tableName: 'users', timestamps: false });
User.associate = function (models) {
  User.belongsTo(models.Organization, { foreignKey: 'org_id' });
  User.hasMany(models.LedgerImport, { foreignKey: 'uploaded_by', as: 'uploadedImports' });
  User.hasMany(models.AgentRun, { foreignKey: 'triggered_by', as: 'triggeredRuns' });
  User.hasMany(models.Approval, { foreignKey: 'approver_id', as: 'approvals' });
  User.hasMany(models.Notification, { foreignKey: 'user_id', as: 'notifications', onDelete: 'CASCADE' });
};
return User;
};
