
/**!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
*/


(function() {
  var async, config, express, staticHandler, tempFileHandle;

  express = require('express');

  async = require('async');

  config = require('../config');

  staticHandler = {
    /**
     * handler 静态文件HTTP请求处理
     * @return {Function} 返回express的middleware
    */

    handler: function(staticPath, staticPrefix) {
      var handler, maxAge, mergefileMarkStr, otherParser;
      if (staticPath == null) {
        staticPath = config.staticPath;
      }
      maxAge = 1;
      if (config.isProductionMode) {
        maxAge = config.fileMaxAge * 1000;
      }
      otherParser = require('./otherparser').parser(staticPath);
      handler = express["static"]("" + staticPath, {
        maxAge: maxAge,
        redirect: false
      });
      mergefileMarkStr = '?mergefile=true';
      return function(req, res, next) {
        var path, tempFile;
        if (~req.url.indexOf(mergefileMarkStr)) {
          path = require('path');
          tempFile = path.join(staticPath, req.url).replace(mergefileMarkStr, '');
          return tempFileHandle(tempFile, function() {
            return handler(req, res, next);
          });
        } else {
          return otherParser(req, res, function() {
            return handler(req, res, next);
          });
        }
      };
    }
  };

  /**
   * tempFileHandle 临时文件夹的文件处理
   * @param  {String} file 文件名
   * @param  {Function} cbf 回调函数
   * @return {[type]}      [description]
  */


  tempFileHandle = function(file, cbf) {
    var count, fs;
    fs = require('fs');
    count = 0;
    return async.whilst(function() {
      return count < 5;
    }, function(cbf) {
      return fs.exists(file, function(exists) {
        if (exists) {
          count = 5;
          return cbf();
        } else {
          count++;
          return GLOBAL.setTimeout(cbf, 50);
        }
      });
    }, function(err) {
      return cbf();
    });
  };

  module.exports = staticHandler;

}).call(this);
