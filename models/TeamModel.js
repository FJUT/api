var Sequelize = require("sequelize");
var User = require("./UsersModel");

module.exports = function(sequelize, DataTypes){
    const team = sequelize.define("gospel_teams", {
			id: {
				type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
				primaryKey: true
			},
	    name: DataTypes.STRING,
      members: DataTypes.JSONB,
      applications: DataTypes.JSONB,
      creator: {
          type: DataTypes.STRING,
          references: {
            model: User,
            key: 'id'
          }
          },
      isDeletted: { type: DataTypes.INTEGER, field: "isdeleted", defaultValue: 0 }
	  },{
			timestamps: true,
      createdAt: 'createat',
      updatedAt: 'updateat',
      classMethods:{
           associate: (models) => {
                      console.log("associate");
                  },
          loadAll: function*(){
              return this.findAll({
                include: [
                  { model: Group }
                ]
              });
          },
          create: function*(group){
              var row = this.build(group);
              return yield row.save();
          }
      }
    });
    return team;
}
