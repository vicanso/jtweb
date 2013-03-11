
/**!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
*/


(function() {
  var appPath, config, path, readonlyProperties, writableProperties, _;

  path = require('path');

  _ = require('underscore');

  appPath = path.dirname(process.mainModule.filename);

  writableProperties = {
    appPath: appPath,
    staticPrefix: "/static",
    staticPath: "" + appPath + "/statics",
    tempStaticPrefix: '/statics/temp',
    tempPath: "" + appPath + "/statics/temp",
    fileMaxAge: 15 * 60,
    dbCacheKeyPrefix: 'jtCache_',
    redisInfo: null
  };

  readonlyProperties = {
    isMaster: require('cluster').isMaster || false,
    isProductionMode: process.env.NODE_ENV === 'production'
  };

  config = {};

  _.each(writableProperties, function(value, property) {
    return Object.defineProperty(config, property, {
      enumerable: true,
      configurable: false,
      writable: true,
      value: value
    });
  });

  _.each(readonlyProperties, function(value, property) {
    return Object.defineProperty(config, property, {
      enumerable: true,
      configurable: false,
      writable: false,
      value: value
    });
  });

  module.exports = config;

}).call(this);
