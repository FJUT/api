var util = require('../utils.js');
var models = require('../models');
var config = require('../configs');
var shells = require('../shell');
var parse = require('co-body');
var uuid = require('node-uuid')
var transliteration = require('transliteration');
var portManager = require('../port');
var common = require('./common');
var processes =  require('../process');
var dnspod = require('../server/dnspod');

var applications = {};
//数据渲染，todo:分页参数引入，异常信息引入
function render(data,all,cur,code,message) {

	return {
		code: code,
		message: message,
		all: all,
		cur: cur,
		fields: data
	}
}

applications.create = function*() {


  if ('POST' != this.method) this.throw(405, "method is not allowed");
    var application = yield parse(this, {
      limit: '1kb'
    });
		console.log(application);
    //应用中文转英文
    var domain  = application.name;
    var reg = /[\u4e00-\u9FA5]+/;
    var res = reg.test(domain);

    if(res){
      var tr = transliteration.transliterate
      domain = tr(domain).replace(new RegExp(" ",'gm'),"").toLocaleLowerCase();
    }
		application.id = uuid.v4();
  	//二级域名解析
		var node = processes.init({
			do: function*() {
				var self = this;
				var inserted = yield models.gospel_domains.create(self.data);
				self.data = inserted;
				if(inserted.code == 'failed') {
						throw("二级域名解析失败，请重命名应用名");
				}
			},
			data: {
					subDomain: domain + "-" +application.creator,
	        domain: config.dnspod.baseDomain,
	        ip: '120.76.235.234',
					application: application.id,
	        creator: application.creator,
					sub: true
	    },
			undo: function*() {

				var self = this;
				console.log(self.data.message);
				var options = {
					method: 'recordRemove',
					opp: 'recordRemove',
					param: {
								domain: "gospely.com",
								record_id: self.data.message.record
					}
				}

				var result = yield dnspod.domainOperate(options);
				if(result.status.code == '1'){
						yield models.gospel_domains.delete(self.data.message.id);
				}
				console.log("undo first");
			},
		});

		//nginx配置文件
		application.appPort = yield portManager.generatePort();
		node = processes.buildNext(node, {
			do: function*() {

					console.log("success");
					var self = this;
					var result = yield shells.domain(self.data);
					if(result != 'success'){
							throw('创建应用失败');
					}
				},
			data:{
				user: application.creator,
				domain: domain  + "-" + application.creator,
				port: application.appPort,
			},
			undo: function*() {

				var self = this;
				var name = self.data.domain.replace('-','_')
				yield shells.delNginxConf(name);
				yield shells.nginx();
				console.log("undo domain");
			},
		});

		//docker 创建

		//var data = yield shells.nginx();
		// console.log(data);
		//创建并启动docker

		application.socketPort = yield portManager.generatePort();
		if(application.appPort == application.socketPort){
			application.appPort  = yield portManager.generatePort();
		}
		application.sshPort = yield portManager.generatePort();
		if(application.sshPort == application.socketPort){

			application.socketPort = yield portManager.generatePort();
		}
		node = processes.buildNext(node, {
			do: function*() {
					var self = this;
					var result = yield shells.docker(self.data);
					if(result != 'success'){
							throw('创建应用失败');
					}
				},
			data:{
				name: application.creator + "_" + domain,
				sshPort: application.sshPort,
				socketPort: application.socketPort,
				appPort: application.appPort,
				password: application.password,
				memory: application.memory,
				file: application.imageName
			},
			undo: function*() {

				var self = this;
				yield shells.stopDocker({
					name: self.data.name
				});
				yield shells.rmDocker({
					name: self.data.name
				});
				console.log("undo docker");
			},
		});

		//将应用记录存储到数据库
		application.docker = 'gospel_project_' + application.creator + "_" + domain;
		application.status = 1;
		application.domain = domain;
		delete application['memory'];
		node = processes.buildNext(node, {
			do: function*() {
						var self = this;
						var inserted = yield models.gospel_applications.create(self.data);
						self.data = inserted;
						if(!inserted){
								throw('创建应用失败');
						}
				},
			data:application,
			undo: function*() {
				var self = this;
				console.log("undo application");
				yield models.gospel_applications.delete(self.data.id);
			},
		});
		var result = yield node.excute();
		console.log(result);
		if(result){
			this.body = render(null,null,null,1,'创建成功');
		}else{
			this.body = render(null,null,null,1,'创建失败');
		}
}
module.exports = applications;
