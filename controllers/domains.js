var util = require('../utils.js');
var parse = require('co-body');
var models = require('../models');
var dnspod = require('../server/dnspod');

var domains = {};




//域名绑定
function render(data,all,cur,code,message) {

	return {
		code: code,
		message: message,
		all: all,
		cur: cur,
		fields: data
	}
}
domains.bind =  function*() {

  if ('POST' != this.method) this.throw(405, "method is not allowed");
    var domain = yield parse(this, {
      limit: '1kb'
    });
    console.log(domain);
    var options = {
        method: 'domainCreate',
        opp: 'domainCreate',
        param: {
              domain: domain.domain,
        }
    }
    var data = dnspod.domainOperate(options);

    if(data.status.code == '1') {
      //解析
      var options = {
          method: 'recordCreate',
          opp: 'recordCreate',
          param: {
                domain: domain,
                record_type: 'A',
                record_line: '默认',
                value:  config.dnspod.baseIp,
                mx: '10'
          }
      }
      var result = yield dnspod.domainOperate(options);
      if(result.status.code == '1') {
        domain.sub = false;
        domain.record = result.record.id;
        var inserted = models.gospel_domains.create(domain);
        this.body = render(inserted,null,null,1,'添加域名成功');
      }else{
        this.body = render(inserted,null,null,-1, result.status.message +'添加域名失败');
      }
    }else{
      this.body = render(inserted,null,null,-1, result.status.message +'添加域名失败');
    }
  }
domains.delete = function*() {

    var id = this.params.id;

    var domain = yield models.gospel_domains.findById(id);
    console.log(domain);
    var options = {
      method: 'recordRemove',
      opp: 'recordRemove',
      param: {
            domain: "gospely.com",
            record_id: domain.record
      }
    }

    var result = yield dnspod.domainOperate(options);

    if(result.status.code == '1'){

      var options = {
        method: 'recordRemove',
        opp: 'recordRemove',
        param: {
              domain: domain.domain,
        }
      }
      var deleted = yield models.gospel_domains.delete(id);

      this.body = render(deleted,null,null,1,'删除成功');
    }else{
      this.body = render(deleted,null,null,-1,result.status.message + ',域名解绑失败');
    }

}
domains.update = function*() {

  console.log("update");
  if ('PUT' != this.method) this.throw(405, "method is not allowed");
    var item = yield parse(this, {
      limit: '1kb'
    });
  var domain = yield models.gospel_domains.findById(item.id);
  var options = {
    method: 'recordModify',
    opp: "recordModify",
    param: {
      domain: domain.domain,
      subDomain: item.domain,
      record_line_id: domain.record,
      record_type: 'A',
      record_line: '默认',
      value:  domain.ip,
      mx: '10'
    }
  }
  var result = yield dnspod.domainOperate(options);

  if(result.status.code == '1'){
    this.body = render(deleted,null,null,1,'修改成功');
  }else{
    this.body = render(deleted,null,null,-1,result.status.message + ',修改失败');
  }
}

module.exports = domains;
