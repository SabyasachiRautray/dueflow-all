module.exports = (s, D) => {
const LedgerImport = s.define('LedgerImport', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true }, org_id: { type: D.INTEGER, allowNull: false }, uploaded_by: { type: D.INTEGER, allowNull: false },
  file_name: D.STRING(255), file_hash: { type: D.CHAR(64), allowNull: false }, row_count: { type: D.INTEGER, defaultValue: 0 },
  status: { type: D.ENUM('processing','done','failed'), defaultValue: 'processing' }, created_at: { type: D.DATE, defaultValue: D.NOW },
}, { tableName: 'ledger_imports', timestamps: false, indexes: [{ unique: true, name: 'uq_import', fields: ['org_id','file_hash'] }] });
LedgerImport.associate = function (models) {
  LedgerImport.belongsTo(models.Organization, { foreignKey: 'org_id' });
  LedgerImport.belongsTo(models.User, { foreignKey: 'uploaded_by', as: 'uploader' });
  LedgerImport.hasMany(models.Invoice, { foreignKey: 'import_id', as: 'invoices' });
};
return LedgerImport;
};
