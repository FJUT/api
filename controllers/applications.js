var util = require('../utils.js');
var models = require('../models');
var config = require('../configs');
var parse = require('co-body');
var uuid = require('node-uuid')
var common = require('./common');
var processes = require('../process');
var dnspod = require('../server/dnspod');
var _md5 = require('../utils/MD5');
var shell = require('../shell');
var validator = require('../utils/validator');

var applications = {};
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
applications.fast_deploy = function*(application,ctx){

	var image = yield models.gospel_images.findById(application.image);
	if (application.free) {

		var products = application.products;
		delete application['products'];
		delete application['price'];
		delete application['size'];
		delete application['unit'];
		delete application['unitPrice'];
		delete application['free'];

		var inserted = yield models.gospel_applications.create(application);
		inserted.databaseType = application.databaseType;
		yield models.gospel_uistates.create({
			application: inserted.id,
			creator: application.creator,
			configs: image.defaultConfig
		});
		inserted.products = products;
		var result = yield processes.fast_deploy(inserted);
		if (result) {
			ctx.body = render(inserted, null, null, 1, "应用创建成功");
		} else {
			ctx.body = render(inserted, null, null, -1, "应用创建失败");
			 yield models.gospel_applications.delete(inserted.id);
		}
	} else {

		application.id = uuid.v4();
		var order = yield models.gospel_orders.create({
			products: application.products,
			orderNo: _md5.md5Sign("gospel", uuid.v4()),
			name: "付费Docker",
			price: application.price,
			status: 1,
			type: 'docker',
			timeSize: application.size,
			timeUnit: application.unit,
			unitPrice: application.unitPrice,
			creator: application.creator,
			application: application.id
		});
		application.orderNo = order.id;
		application.payStatus = -1;


		delete application['products'];
		delete application['price'];
		delete application['size'];
		delete application['unit'];
		delete application['unitPrice'];
		delete application['free'];
		var inserted = yield models.gospel_applications.create(application);
		yield models.gospel_uistates.create({
			application: inserted.id,
			creator: application.creator,
			configs: image.defaultConfig
		});
		ctx.body = render(inserted, null, null, 1, "创建成功, 你选择的是收费配置, 请尽快去支付");
	}
}
applications.deploy = function*(application,ctx) {

	var app = yield models.gospel_applications.findById(application.id);
	if (application.free) {

		app.products = application.products;
		var result = yield processes.app_start(app);
		if (result) {
			var inserted = yield models.gospel_applications.modify({
				id: application.id,
				status: 1,
				products: application.products
			});
			ctx.body = render(inserted, null, null, 1, "部署创建成功");
		} else {
			ctx.body = render(inserted, null, null, -1, "部署创建失败");
		}
	} else {

		var order = yield models.gospel_orders.create({
			products: application.products,
			orderNo: _md5.md5Sign("gospel", uuid.v4()),
			name: "付费Docker",
			price: application.price,
			status: 1,
			type: 'docker',
			timeSize: application.size,
			timeUnit: application.unit,
			unitPrice: application.unitPrice,
			creator: app.creator,
			application: application.id
		});
		var inserted = yield models.gospel_applications.modify({
			id: application.id,
			orderNo: order.id,
			payStatus: -1,
		});
		ctx.body = render(inserted, null, null, 1, "创建成功, 你选择的是收费配置, 请尽快去支付");
	}
}

applications.delete = function*() {


	var id = this.params.id;
	var application = yield models.gospel_applications.findById(id);
	//将中文英语名转英文
	var domain = application.domain;
	var projectFolder = application.docker.replace('gospel_project_','');

	try {
		if(domain != null) {
			// var reg = /[\u4e00-\u9FA5]+/;
			// var res = reg.test(domain);
			//
			// if(res){
			// 	var tr = transliteration.transliterate
			// 	domain = tr(domain).replace(new RegExp(" ",'gm'),"").toLocaleLowerCase();
			// }

			//获取应用的二级域名
			var domains = yield models.gospel_domains.getAll({
				subDomain: application.domain,
				sub: true,
			})
			var options = {
				method: 'recordRemove',
				opp: 'recordRemove',
				param: {
					domain: "gospely.com",
					record_id: domains[0].record
				}
			}
			//解绑二级域名
			yield dnspod.domainOperate(options);
			//删除二级域名
			yield models.gospel_domains.delete(domains[0].id);

			var name = domain.replace("-", "_");
			//删除nginx配置文件
			yield shell.delNginxConf({
				host: application.host,
				name: name,
			});
			yield shell.nginx({
				host: application.host,
			});
		}
		//删除docker
		yield shell.stopDocker({
			host: application.host,
			name: application.docker,
		});
		yield shell.rmDocker({
			host: application.host,
			name: application.docker,
		});
		//删除项目文件资源
		yield shell.rmFile({
			fileName: "/var/www/storage/codes/" + application.creator + '/' + projectFolder,
			host: application.host,
		})
	} catch (e) {
		console.log(e);
	} finally {

		var inserted = yield models.gospel_applications.delete(application.id);
		if (!inserted) {
			this.throw(405, "couldn't be delete.");
		}
		this.body = render(inserted, null, null, 1, '删除成功');
	}
}
applications.killPID = function*(){

	var docker = this.query.docker,
		pid = this.query.pid,
		host = this.query.host;

	yield shell.killPID({
		docker: docker,
		pid: pid,
		host: host
	});
	this.body = render(null, null, null, 1, 'success');
}
//新建应用
applications.create = function*() {

	//用户输入校验
	// var reg = [{
	// 	name: 'name',
	// },{
	// 	name: 'languageType',
	// }];
	// var messages = validator.validate(application,reg);
	if ('POST' != this.method) this.throw(405, "method is not allowed");
	var application = yield parse(this, {
		limit: '10kb'
	});
	if(application.id !=null && application.id != undefined && application.id != ''){
		yield applications.deploy(application,this);
	}else {

		if(application.deploy){
			yield applications.fast_deploy(application,this);
		}else{
			var result = yield processes.initDebug(application);

			if (result) {
				this.body = render(result, null, null, 1, "应用创建成功");
			} else {
				this.body = render(result, null, null, -1, "应用创建失败");
			}
		}
	}
}
applications.startTerminal = function*(){
	var containerName = this.query.docker;
	shell.startTerminal({
		docker: containerName
	});
	this.body = render(null, null, null, 1, '启动成功');
}
module.exports = applications;
