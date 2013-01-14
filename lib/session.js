
/**!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
*/


(function() {
  var RedisStore, config, defaultOptions, defaultRedisOptions, express, session, sessionHandleFunctions, _;

  express = require('express');

  _ = require('underscore');

  RedisStore = require('connect-redis')(express);

  config = require('../config');

  defaultOptions = {
    key: 'vicanso',
    secret: 'jenny&tree'
  };

  defaultRedisOptions = {
    client: null,
    ttl: 30 * 60
  };

  sessionHandleFunctions = {};

  session = {
    /**
     * parser session的处理函数
     * @return {Function} 返回express的middleware处理函数
    */

    parser: function() {
      return function(req, res, next) {
        var cookieParser;
        cookieParser = express.cookieParser();
        return cookieParser(req, res, function() {
          var appName, _ref;
          appName = ((_ref = req._info) != null ? _ref.appName : void 0) || 'all';
          if (!sessionHandleFunctions.all) {
            session.addConfig('all');
          }
          return session.getParser(appName)(req, res, next);
        });
      };
    },
    /**
     * addConfig 添加session的处理配置
     * @param {String} appName app的名字（不同的app可以有不同的处理配置，若不加，则可使用默认的配置）
     * @param {Object} options session的存储配置（key, secret）
    */

    addConfig: function(appName, redisOptions, options) {
      if (appName) {
        options = _.extend({}, defaultOptions, options);
        if (!defaultRedisOptions.client) {
          defaultRedisOptions.client = config.redisClient;
        }
        redisOptions = _.extend({}, redisOptions, defaultRedisOptions);
        options.store = new RedisStore(redisOptions);
        return sessionHandleFunctions[appName] = express.session(options);
      }
    },
    /**
     * getParser 根据app获得处理函数
     * @param  {String} appName app的名字，若不添加，则默认为'all'
     * @return {Function} 返回处理函数
    */

    getParser: function(appName) {
      if (appName == null) {
        appName = 'all';
      }
      return sessionHandleFunctions[appName] || sessionHandleFunctions['all'];
    }
  };

  module.exports = session;

}).call(this);
