module.exports = (s, D) => {
const VendorNotice = s.define('VendorNotice', {
  id: { type: D.BIGINT, primaryKey: true, autoIncrement: true }, vendor_id: { type: D.INTEGER, allowNull: false }, invoice_id: D.BIGINT,
  type: { type: D.ENUM('payment_scheduled','certificate_request','delay_notice'), allowNull: false }, subject: D.STRING(200), body: D.TEXT,
  status: { type: D.ENUM('drafted','approved','sent','failed'), defaultValue: 'drafted' }, sent_at: D.DATE,
}, { tableName: 'vendor_notices', timestamps: false });
VendorNotice.associate = function (models) {
  VendorNotice.belongsTo(models.Vendor, { foreignKey: 'vendor_id' });
  VendorNotice.belongsTo(models.Invoice, { foreignKey: 'invoice_id' });
};
return VendorNotice;
};
