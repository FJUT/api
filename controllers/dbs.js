var util = require('../utils.js');
var shells = require('../shell');
var portManager = require('../port');
var models = require('../models');
var dbs = {};
//数据渲染，todo:分页参数引入，异常信息引入
function render(data, all, cur, code, message) {

	return {
		code: code,
		message: message,
		all: all,
		cur: cur,
		fields: data
	}
}

dbs.create = function*() {

	var db = yield parse(this, {
		limit: '1kb'
	});
	var reg = /[\u4e00-\u9FA5]+/;
	var res = reg.test(db.name);
	var user = yield models.gospel_users.findById(db.creator);
	var dbName = '';
	if (res) {
		var tr = transliteration.transliterate
		dbName = tr(db.name).replace(new RegExp(" ", 'gm'), "").toLocaleLowerCase();
	} else {
		dbName = db.name;
	}
	db.port = yield portManager.generatePort();
	console.log(db);
	if (db.type == 'mysql') {
		console.log('mysq');
		db.description = '默认用户:root,访问端口:' + db.port;
	}
	if (db.type == 'mongodb') {
		db.httpPort = yield portManager.generatePort();
		db.description = '默认用户:admin,mongodb 服务端口:' + db.port + ',http服务端口:' + db.httpPort;
	}
	if (db.type == 'postgres') {
		db.description = '默认用户:postgres,访问端口是' + db.port;
	}
	console.log(dbName);
	var result = yield shells.buidDB({
		dbName: user.name + '-db-' + dbName,
		password: db.password,
		port: db.port,
		user: db.creator,
		type: db.type,
		httpPort: db.httpPort
	});
	console.log(result);

	console.log('create');
	var inserted = yield models.gospel_dbs.create(db);
	this.body = render(inserted, null, null, 1, '创建数据成功');
}

module.exports = dbs;
