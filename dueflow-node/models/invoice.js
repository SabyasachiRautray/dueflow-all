module.exports = (s, D) => {
const Invoice = s.define('Invoice', {
  id: { type: D.BIGINT, primaryKey: true, autoIncrement: true }, org_id: { type: D.INTEGER, allowNull: false }, vendor_id: { type: D.INTEGER, allowNull: false }, import_id: D.INTEGER,
  invoice_no: { type: D.STRING(60), allowNull: false }, invoice_date: { type: D.DATEONLY, allowNull: false }, acceptance_date: { type: D.DATEONLY, allowNull: false },
  amount: { type: D.DECIMAL(14,2), allowNull: false }, amount_paid: { type: D.DECIMAL(14,2), allowNull: false, defaultValue: 0 }, due_date: D.DATEONLY,
  days_remaining: D.INTEGER, risk_level: { type: D.ENUM('safe','watch','urgent','overdue','not_applicable'), defaultValue: 'safe' },
  status: { type: D.ENUM('open','planned','approved','paid','disputed'), defaultValue: 'open' }, dispute_note: D.STRING(500),
  created_at: { type: D.DATE, defaultValue: D.NOW }, updated_at: { type: D.DATE, defaultValue: D.NOW },
}, { tableName: 'invoices', timestamps: false, indexes: [{ unique: true, name: 'uq_invoice', fields: ['org_id','vendor_id','invoice_no'] }, { name: 'idx_risk', fields: ['org_id','status','due_date'] }] });
Invoice.associate = function (models) {
  Invoice.belongsTo(models.Organization, { foreignKey: 'org_id' });
  Invoice.belongsTo(models.Vendor, { foreignKey: 'vendor_id' });
  Invoice.belongsTo(models.LedgerImport, { foreignKey: 'import_id' });
  Invoice.hasMany(models.PlanItem, { foreignKey: 'invoice_id', as: 'planItems' });
  Invoice.hasMany(models.Payment, { foreignKey: 'invoice_id', as: 'payments' });
  Invoice.hasMany(models.VendorNotice, { foreignKey: 'invoice_id', as: 'notices' });
};
return Invoice;
};
