var Sequelize = require("sequelize");

module.exports = function(sequelize, DataTypes){
    const application=sequelize.define("gospel_applications", {
			id: {
				type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
				primaryKey: true
			},
	    name: DataTypes.STRING,
      port: DataTypes.STRING,
      sshPort: { type: DataTypes.INTEGER, field: "ssh_port", defaultValue: 21 },
      source: DataTypes.STRING,
      domain: DataTypes.STRING,
      members: DataTypes.STRING,
      team:DataTypes.STRING,
      creator: DataTypes.STRING,
      volume: DataTypes.STRING,
      dockerConfig: { type: DataTypes.STRING, field: "docker_config" },
      isDeleted: { type: DataTypes.INTEGER, field: "isdeleted", defaultValue: 0 }
	  },{
			timestamps: true,
      createdAt: 'createat',
      updatedAt: 'updateat',
      classMethods:{
           associate: (models) => {
                      console.log("associate");
                  }
      }
    });
    return application;
}
