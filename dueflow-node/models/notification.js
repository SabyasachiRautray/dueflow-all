module.exports = (s, D) => {
const Notification = s.define('Notification', {
  id: { type: D.BIGINT, primaryKey: true, autoIncrement: true }, user_id: { type: D.INTEGER, allowNull: false }, type: D.STRING(50), payload: D.JSON, read_at: D.DATE,
  created_at: { type: D.DATE, defaultValue: D.NOW },
}, { tableName: 'notifications', timestamps: false });
Notification.associate = function (models) { Notification.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' }); };
return Notification;
};
