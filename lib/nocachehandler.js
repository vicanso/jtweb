(function() {
  var defaultFilter, defaultHandler, defaultNoCacheContent, handlerList, headerOptions, httpHandler, nocacheHandler, _;

  httpHandler = require('./httphandler');

  _ = require('underscore');

  handlerList = {};

  headerOptions = {
    'Cache-Control': 'no-cache, no-store, max-age=0'
  };

  defaultNoCacheContent = '';

  nocacheHandler = {
    /**
     * handler 返回用于处理非缓存信息的express middleware
     * @return {[type]} [description]
    */

    handler: function() {
      return function(req, res, next) {
        var appName, filter, handler, _ref;
        appName = (_ref = req._info) != null ? _ref.appName : void 0;
        handler = handlerList[appName];
        filter = (handler != null ? handler.filter : void 0) || defaultFilter;
        if (filter(req)) {
          if (handler) {
            return handler.handle(req, function(text) {
              if (!handler.coverage && defaultHandler) {
                return defaultHandler(req, function(defaultText) {
                  text += defaultText;
                  return httpHandler.response(req, res, text, headerOptions);
                });
              } else {
                return httpHandler.response(req, res, text, headerOptions);
              }
            });
          } else {
            return defaultHandler(req, function(defaultText) {
              return httpHandler.response(req, res, defaultText, headerOptions);
            });
          }
        } else {
          return next();
        }
      };
    },
    /**
     * addHandler 添加app的web info处理方法
     * @param {String} appName  app的名字
     * @param {Boolean} {optional} coverage 是否复盖默认的实现
     * @param {Function} handle 处理函数
     * @param {Function} filter 判断该请求是否符合
    */

    addHandler: function(appName, coverage, handle, filter) {
      if (_.isFunction(coverage)) {
        handle = coverage;
        coverage = false;
      }
      return handlerList[appName] = {
        coverage: coverage,
        handle: handle,
        filter: filter
      };
    },
    /**
     * set 设置nocache的一些默认配置
     * @param {String} key 设置的配置名称
     * @param {Function} value 配置的处理方法
    */

    set: function(key, value) {
      var defaultFilter, defaultHandler;
      switch (key) {
        case 'defaultFilter':
          if (_.isFunction(value)) {
            return defaultFilter = value;
          }
          break;
        case 'defaultHandler':
          if (_.isFunction(value)) {
            return defaultHandler = value;
          }
      }
    }
  };

  defaultFilter = function() {
    return false;
  };

  defaultHandler = function(req, cbf) {
    return cbf('');
  };

  module.exports = nocacheHandler;

}).call(this);
