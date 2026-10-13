module.exports = (sequelize, DataTypes) => {
    const Organization = sequelize.define("Organization", {
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true 
        },
        name: { 
            type: DataTypes.STRING(150), 
            allowNull: false 
        },
        gstin: { 
            type: DataTypes.STRING(15) 
        }
    });

    return Organization;
};