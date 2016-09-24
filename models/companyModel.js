var Sequelize = require("sequelize");

module.exports = function(sequelize, DataTypes){
    const company = sequelize.define("gospel_companys", {
			id: {
				type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
				primaryKey: true
			},
	    name: DataTypes.STRING,
      owner: DataTypes.STRING,
      ownerIdentify: { type:DataTypes.STRING, field: "owner_identify" },
      creator: DataTypes.STRING,
      inviteLink: { type: "invite_link" , field: "invite_link" },
      licencePhoto: { type: DataTypes.STRING, field: "licence_photo" },
      status: DataTypes.INTEGER,
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
    return company;
}
