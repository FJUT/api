var Sequelize = require("sequelize");

module.exports = function(sequelize, DataTypes) {
  const image = sequelize.define("gospel_images", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    label: DataTypes.INTEGER,
    git: DataTypes.STRING,
    dockerfile: DataTypes.STRING,
    type: DataTypes.INTEGER,
    parent: DataTypes.STRING,
    port: DataTypes.STRING,
    cmds: DataTypes.STRING,
    defaultConfig: {
      type: DataTypes.STRING,
      field: 'default_config'
    },
    devType: {
      type: DataTypes.STRING,
      field: 'dev_type',
      defaultValue: 'common' //common | visual
    },
    debugType: {
      type: DataTypes.STRING,
      field: 'debug_type',
      defaultValue: 'common' //common | shell
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
  return image;
}
