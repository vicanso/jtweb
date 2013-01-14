
/**!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
*/


(function() {
  var appInfo, config, middleware, nocacheHandler, session, _,
    __slice = [].slice;

  _ = require('underscore');

  appInfo = require('./lib/appinfo');

  session = require('./lib/session');

  nocacheHandler = require('./lib/nocachehandler');

  config = require('./config');

  middleware = {
    set: function() {
      var args, options;
      options = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (_.isString(options)) {
        switch (options) {
          case 'nocache':
            return nocacheHandler.set.apply(nocacheHandler, args);
        }
      } else if (_.isObject(options)) {
        return _.extend(config, options);
      }
    },
    staticHandler: function() {
      return require('./lib/static').handler();
    },
    sessionParser: function() {
      return session.parser();
    },
    infoParser: function() {
      return appInfo.parser();
    },
    fileImporter: function() {
      return require('./lib/fileimporter');
    },
    fileMerger: function() {
      return require('./lib/filemerger');
    },
    nocacheHandlerSet: function(key, value) {},
    addInfoParser: function(parser) {
      if (_.isFunction(parser)) {
        return appInfo.addParser(parser);
      }
    },
    addSessionConfig: function(appName, redisOptions, options) {
      if (appName && redisOptions) {
        return session.addConfig(appName, redisOptions, options);
      }
    },
    addNocacheInfoParser: function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return nocacheHandler.addHandler.apply(nocacheHandler, args);
    },
    httpHandler: function() {
      return require('./lib/httphandler');
    },
    routeHandler: function() {
      return require('./lib/routehandler');
    },
    nocacheInfoParser: function() {
      return nocacheHandler.handler();
    },
    errorPageHandler: function() {
      return require('./lib/errorpage').handler();
    }
  };

  module.exports = middleware;

}).call(this);
