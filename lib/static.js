
/**!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
*/


(function() {
  var config, express, staticHandler;

  express = require('express');

  config = require('../config');

  staticHandler = {
    /**
     * handler 静态文件HTTP请求处理
     * @return {Function} 返回express的middleware
    */

    handler: function() {
      var handler, maxAge, otherParser, staticCompressHandler, staticPath, staticPrefix, staticPrefixLength;
      staticPath = config.staticPath;
      staticPrefix = config.staticPrefix;
      staticPrefixLength = staticPrefix.length;
      staticCompressHandler = express.compress({
        memLevel: 9
      });
      maxAge = 1;
      if (config.isProductionMode) {
        maxAge = config.fileMaxAge * 1000;
      }
      otherParser = require('./otherparser').parser(staticPath);
      handler = express["static"]("" + staticPath, {
        maxAge: maxAge,
        redirect: false
      });
      return function(req, res, next) {
        if (req.url.substring(0, staticPrefixLength) === staticPrefix) {
          req.url = req.url.substring(staticPrefixLength);
          return staticCompressHandler(req, res, function() {
            return otherParser(req, res, function() {
              return handler(req, res, next);
            });
          });
        } else {
          return next();
        }
      };
    }
  };

  module.exports = staticHandler;

}).call(this);
