var Sequelize = require('sequelize');
var path = require('path');
var config = require('../configs.js');
var reader = require('../utils/reader');

var db = {};

var sequelize = new Sequelize('gospel', 'gospel', 'gospel', {
  host: '119.29.243.71',
  dialect: 'postgresql',
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  define: {
    classMethods: {
      getAll: function*(item){

          console.log();
          var sql = this.getAllInit();

          if(sql != null && sql !=undefined){
            return yield  sequelize.query(sql,
              { replacements: { user: '1' }, type: sequelize.QueryTypes.SELECT })

          }
          item.isDeleted = 0;
          if(item.cur != null && item.cur != undefined){

              var offset = (item.cur-1)*item.limit;
              var limit = item.limit;
              var attributes = [];
              if(item.show != null && item.show != undefined && item.show != ''){
                  attributes = item.show.split('_');
                  delete item['cur'];
                  delete item['limit'];
                  delete item['show'];

                  return yield this.findAll({
                                            offset: offset,
                                            limit: limit,
                                            where: item,
                                            attributes: attributes
                                          });

              }else{

                delete item['limit'];
                delete item['cur'];

                return yield this.findAll({
                                          offset: offset,
                                          limit: limit,
                                          where: item
                                        });
              }

          }
          console.log(item.show);
          if(item.show != null && item.show != undefined && item.show != ''){
              attributes = item.show.split('_');
              delete item['show'];
              return yield this.findAll({
                                        where:item,
                                        attributes: attributes
                                      });
          }else{

            console.log("no page ,no selec");
            return yield this.findAll({
                                      where:item
                                    });
          }

      },
      findById: function*(id) {
          console.log("find " + id);

          return yield this.find({where:{id:id } });
      },
      delete: function*(id){
          console.log("delete" + id)
          return yield this.update({isDeleted: 1},{where: {id: id, isDeleted: '0' } });
      },
      modify: function*(item) {
          console.log("update" + item.id);
          return yield this.update(item,{where:{id:item.id } });
      },
      create: function*(item) {
          console.log("create");
          var row = this.build(item);
          return yield row.save();
      },
      count: function* (item) {
        item.isDeleted = 0;
          return  yield this.findAll({
                                    where: item,
                                    attributes: [[sequelize.fn('COUNT', sequelize.col('id')), 'all']]
                                  });
      }
    },

    instanceMethods: {

    }
  }
});

/**
 * Takes a read file and passes it to sequelize import
 * Puts all references inside a DB object for easy getting
 *
 * @param  {String} file read model file definition
 * @return {array}      returns array of models
 */
function loadModel(file) {

    var model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;

    return model;
}

// read all the models inside the models/ directory and load them
reader.readDir(__dirname).map(loadModel);

/**
 * Make an association to the DB object,
 * not really sure what's this for
 *
 * @param  {string} modelName Name of the model
 */
function makeAssociation(modelName) {
    if (typeof db[modelName].associate === 'function') {
        db[modelName].associate(db);
    }
}

Object.keys(db).map(makeAssociation);


db.Sequelize = Sequelize;
db.sequelize = sequelize;
module.exports = db;
