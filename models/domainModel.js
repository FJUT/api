var Sequelize = require("sequelize");
var dnspod = require('../server/dnspod')
var config =  require('../configs')

module.exports = function(sequelize, DataTypes){
    const domain = sequelize.define("gospel_domains", {
			id: {
				type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
				primaryKey: true
			},
	    domain: DataTypes.STRING,
      ip: DataTypes.STRING,
      creator: DataTypes.STRING,
      application: DataTypes.STRING,
      record: DataTypes.STRING,
      isDeleted: { type: DataTypes.INTEGER, field: "isdeleted", defaultValue: 0 },
	  },{
			timestamps: true,
      createdAt: 'createat',
      updatedAt: 'updateat',
      classMethods:{
          associate: (models) => {
                  },
          create : function *(domain){

            console.log(dnspod);
            var options = {
                method: 'recordCreate',
                opp: 'recordCreate',
                param: {
                      domain: config.dnspod.baseDomain,
                      sub_domain: "god",
                      record_type: 'A',
                      record_line: '默认',
                      value:'120.76.235.234',
                      mx: '10'
                }
            }
            var data = yield dnspod.domainOperate(options);
            domain.record = data.record.id
            var row = this.build(domain);
            return yield row.save();
          }
      }
    });
    return domain;
}
