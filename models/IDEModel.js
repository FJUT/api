var Sequelize = require("sequelize");

module.exports = function(sequelize, DataTypes) {
  const ide = sequelize.define("gospel_ides", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: DataTypes.STRING,
    product: DataTypes.STRING,
    creator: DataTypes.INTEGER,
    volume: {
      type: DataTypes.STRING,
      defaultValue: '10'
    },
    unit: {
      type: DataTypes.STRING,
      defaultValue: 'G'
    },
    expireAt: {
      type: DataTypes.DATE,
      field: "expireat"
    },
    createat:{
        type: DataTypes.DATE,
        defaultValue: new Date(Date.now() + (8 * 60 * 60 * 1000))
    },
    updateat: {
        type: DataTypes.DATE,
        defaultValue: new Date(Date.now() + (8 * 60 * 60 * 1000))
    },
    isDeleted: {
      type: DataTypes.INTEGER,
      field: "isdeleted",
      defaultValue: 0
    }
  }, {
    timestamps: false,
    createdAt: 'createat',
    updatedAt: 'updateat',
    classMethods: {
      associate: (models) => {

      }
    }
  });
  return ide;
}
