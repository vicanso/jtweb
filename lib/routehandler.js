(function() {
  var FileImporter, config, errorPage, httpHandler, routeHandler, _;

  _ = require('underscore');

  config = require('../config');

  FileImporter = require('./fileimporter');

  httpHandler = require('./httphandler');

  errorPage = require('./errorpage');

  routeHandler = {
    /**
     * initRoutes 初始化路由处理
     * @param  {express对象} app   express的实例
     * @param  {Array} routeInfos  路由配置的信息列表
     * @return {[type]}  [description]
    */

    initRoutes: function(app, routeInfos) {
      return _.each(routeInfos, function(routeInfo) {
        var handle, middleware, routes;
        handle = function(req, res, next) {
          var debug;
          next = _.once(next);
          debug = !config.isProductionMode;
          return routeInfo.handler(req, res, function(err, viewData) {
            var _ref;
            if (err) {
              return next(err);
            } else if (viewData) {
              if (routeInfo.jadeView) {
                viewData.fileImporter = new FileImporter(debug, routeInfo.staticsHost);
                if ((_ref = viewData.title) == null) {
                  viewData.title = '未定义标题';
                }
                return httpHandler.render(req, res, routeInfo.jadeView, viewData);
              } else {
                if (_.isObject(viewData)) {
                  return httpHandler.json(req, res, viewData);
                } else {
                  return httpHandler.response(req, res, viewData);
                }
              }
            } else {
              err = errorPage.error(500, "" + __filename + ": the viewData is null");
              return next(err);
            }
          }, next);
        };
        middleware = routeInfo.middleware || [];
        routes = routeInfo.route;
        if (!_.isArray(routes)) {
          routes = [routes];
        }
        return _.each(routes, function(route) {
          var method;
          method = (routeInfo.type || 'get').toLowerCase();
          return app[method](route, middleware, handle);
        });
      });
    }
  };

  module.exports = routeHandler;

}).call(this);
