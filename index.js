
/**!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
*/


(function() {
  var appInfo, config, initApp, initMongoDb, initRedis, middleware, nocacheHandler, session, _,
    __slice = [].slice;

  _ = require('underscore');

  appInfo = require('./lib/appinfo');

  session = require('./lib/session');

  nocacheHandler = require('./lib/nocachehandler');

  config = require('./config');

  initApp = function(options) {
    var app, defaults, express, jtLogger, jtUtil, opts, routeHandler;
    jtLogger = require('jtlogger');
    jtUtil = require('jtutil');
    express = require('express');
    defaults = {
      viewEngine: 'jade'
    };
    opts = _.extend(defaults, options);
    app = express();
    app.set('view engine', opts.viewEngine);
    app.set('views', opts.viewsPath);
    middleware.set({
      appPath: opts.appPath,
      redisClient: opts.redisClient
    });
    if (opts.firstMiddleware) {
      app.use(opts.firstMiddleware);
    }
    if (!_.isArray(opts.staticSetting)) {
      opts.staticSetting = [opts.staticSetting];
    }
    _.each(opts.staticSetting, function(staticSetting) {
      if (staticSetting.mountPath) {
        return app.use(staticSetting.mountPath, middleware.staticHandler(staticSetting.path));
      } else {
        return app.use(middleware.staticHandler(staticSetting.path));
      }
    });
    if (opts.faviconPath) {
      app.use(express.favicon(opts.faviconPath));
    }
    if (opts.middleware) {
      if (!_.isArray(opts.middleware)) {
        opts.middleware = [opts.middleware];
      }
      _.each(opts.middleware, function(middleware) {
        if (middleware) {
          return app.use(middleware);
        }
      });
    }
    if (opts.mode === 'production') {
      app.use(express.limit('1mb'));
      app.use(jtLogger.getConnectLogger('HTTP-INFO-LOGGER', {
        format: express.logger.tiny
      }));
    } else {
      app.use(express.logger('dev'));
    }
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(middleware.infoParser());
    app.use(middleware.nocacheInfoParser());
    app.use(app.router);
    app.use(middleware.errorPageHandler());
    if (opts.routeInfos) {
      routeHandler = middleware.routeHandler();
      routeHandler.initRoutes(app, opts.routeInfos);
    }
    app.listen(opts.port);
    return console.info("listen port " + opts.port);
  };

  initMongoDb = function(dbConfigs) {
    var defaultConfig, jtMongoDb;
    jtMongoDb = require('jtmongodb');
    defaultConfig = {
      immediatelyInit: true,
      options: {
        w: 0,
        native_parser: false,
        auto_reconnect: true,
        read_secondary: true,
        readPreference: 'secondaryPreferred'
      }
    };
    if (!_.isArray(dbConfigs)) {
      dbConfigs = [dbConfigs];
    }
    _.each(dbConfigs, function(dbConfig, i) {
      return dbConfigs[i] = _.extend(defaultConfig, dbConfig);
    });
    return jtMongoDb.set({
      queryTime: true,
      valiate: true,
      timeOut: 0,
      mongodb: dbConfigs,
      logger: require('jtlogger').getLogger('MONGODB')
    });
  };

  initRedis = function(config) {
    var jtRedis;
    config = _.clone(config);
    jtRedis = require('jtredis');
    return jtRedis.setConfig({
      queryTime: true,
      redis: config
    });
  };

  middleware = {
    initApp: initApp,
    initMongoDb: initMongoDb,
    initRedis: initRedis,
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
    staticHandler: function(staticPath) {
      return require('./lib/static').handler(staticPath);
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
