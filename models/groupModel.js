var Sequelize = require("sequelize");

module.exports = function(sequelize, DataTypes) {
  const group = sequelize.define("gospel_groups", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    privileges: DataTypes.JSONB,
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
  return group;
}
