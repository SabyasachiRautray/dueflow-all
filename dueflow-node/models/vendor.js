module.exports = (s, D) => {
const Vendor = s.define('Vendor', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true }, org_id: { type: D.INTEGER, allowNull: false },
  name: { type: D.STRING(150), allowNull: false }, gstin: D.STRING(15), udyam_no: D.STRING(25),
  msme_type: { type: D.ENUM('micro','small','medium','non_msme','unknown'), defaultValue: 'unknown' },
  activity_type: { type: D.ENUM('manufacturer','trader','service','unknown'), defaultValue: 'unknown' },
  verification_status: { type: D.ENUM('verified','pending','failed','manual_review'), defaultValue: 'pending' },
  verified_at: D.DATE, agreed_credit_days: D.TINYINT.UNSIGNED, email: D.STRING(150), bank_account_ref: D.STRING(100),
}, { tableName: 'vendors', timestamps: false, indexes: [{ unique: true, name: 'uq_vendor', fields: ['org_id','gstin'] }] });
Vendor.associate = function (models) {
  Vendor.belongsTo(models.Organization, { foreignKey: 'org_id' });
  Vendor.hasMany(models.Invoice, { foreignKey: 'vendor_id', as: 'invoices' });
  Vendor.hasMany(models.VendorNotice, { foreignKey: 'vendor_id', as: 'notices' });
  Vendor.hasMany(models.AgentMemory, { foreignKey: 'vendor_id', as: 'memories', constraints: false });
};
return Vendor;
};
