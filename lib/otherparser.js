(function() {
  var config, express, fs, handle, jtUtil, otherParser, parseCoffee, parseLess, parseStylus, path, tempFileHandler, _;

  express = require('express');

  path = require('path');

  jtUtil = require('jtutil');

  _ = require('underscore');

  fs = require('fs');

  config = require('../config');

  express.mime.types['less'] = 'text/css';

  express.mime.types['styl'] = 'text/css';

  express.mime.types['coffee'] = 'application/javascript';

  otherParser = {
    /**
     * parser 其它类型的paser处理
     * @param  {String} staticPath 静态文件目录
     * @return {[type]}            [description]
    */

    parser: function(staticPath) {
      var parseExts, url;
      url = require('url');
      parseExts = ['.less', '.coffee', '.styl'];
      return function(req, res, next) {
        var bufLength, bufList, end, ext, pathname, write;
        pathname = url.parse(req.url).pathname;
        ext = path.extname(pathname);
        if (config.isProductionMode && tempFileHandler.handle(pathname, next)) {

        } else {
          if (~_.indexOf(parseExts, ext)) {
            write = res.write;
            end = res.end;
            bufList = [];
            bufLength = 0;
            res.write = function(chunk, encoding) {
              bufList.push(chunk);
              return bufLength += chunk.length;
            };
            res.end = function(chunk, encoding) {
              var buf, file, self;
              self = this;
              if (Buffer.isBuffer(chunk)) {
                bufList.push(chunk);
                bufLength += chunk.length;
              }
              buf = Buffer.concat(bufList, bufLength);
              file = path.join(staticPath, pathname);
              return handle(file, buf.toString(encoding), function(err, data) {
                if (err) {
                  throw err;
                } else {
                  buf = new Buffer(data, encoding);
                  res.header('Content-Length', buf.length);
                  return end.call(res, buf);
                }
              });
            };
          }
          return next();
        }
      };
    }
  };

  /**
   * handle 处理方法（现有处理less,coffee）
   * @param  {String} file 文件名
   * @param  {String} data 文件数据
   * @param  {Function} cbf 回调函数
   * @return {[type]}      [description]
  */


  handle = function(file, data, cbf) {
    var ext;
    ext = path.extname(file);
    switch (ext) {
      case '.less':
        return parseLess(file, data, cbf);
      case '.coffee':
        return parseCoffee(file, data, cbf);
      case '.styl':
        return parseStylus(file, data, cbf);
    }
  };

  /**
   * parseLess less编译
   * @param  {String} file 文件名
   * @param  {String} data 文件数据
   * @param  {Function} cbf  回调函数
   * @return {[type]}      [description]
  */


  parseLess = function(file, data, cbf) {
    var options;
    options = {
      paths: [path.dirname(file)],
      filename: file
    };
    if (config.isProductionMode) {
      options.compress = true;
    }
    return jtUtil.parseLess(data, options, cbf);
  };

  /**
   * parseCoffee coffee编译
   * @param  {String} file 文件名
   * @param  {String} data 文件数据
   * @param  {Function} cbf 回调函数
   * @return {[type]}      [description]
  */


  parseCoffee = function(file, data, cbf) {
    var options;
    if (config.isProductionMode) {
      options = {
        fromString: true,
        warnings: true
      };
    }
    return jtUtil.parseCoffee(data, options, function(err, jsStr) {
      if (err) {
        err.file = file;
      }
      return cbf(err, jsStr);
    });
  };

  /**
   * parseStylus stylus编译
   * @param  {String} file 文件名
   * @param  {String} data 文件数据
   * @param  {Function} cbf 回调函数
   * @return {[type]}      [description]
  */


  parseStylus = function(file, data, cbf) {
    var options;
    options = {
      filename: file
    };
    if (config.isProductionMode) {
      options.compress = true;
    }
    return jtUtil.parseStylus(data, options, cbf);
  };

  tempFileHandler = {
    tempFilesStatus: {},
    /**
     * initEvent 初始化事件
     * @return {[type]} [description]
    */

    initEvent: function() {
      var fileMergerEvent, self;
      self = this;
      fileMergerEvent = require('./eventhandler').getEvent('fileMergerEvent');
      return fileMergerEvent.on('complete', function(fileNameHash) {
        var status, tempFilesStatus;
        tempFilesStatus = self.tempFilesStatus;
        status = tempFilesStatus[fileNameHash];
        _.each(status, function(cbf) {
          return cbf();
        });
        return tempFilesStatus[fileNameHash] = 'complete';
      });
    },
    /**
     * completeHandle 判断文件是否已经完成，作相应的处理
     * @param  {String}   file 文件名
     * @param  {Function} next express router的next方法
     * @return {Boolean}       [description]
    */

    completeHandle: function(file, next) {
      var ext, fileNameHash, self, status, tempFilesStatus, _ref;
      self = this;
      file = path.join(config.tempPath, file);
      ext = path.extname(file);
      fileNameHash = path.basename(file, ext);
      tempFilesStatus = self.tempFilesStatus;
      if ((_ref = tempFilesStatus[fileNameHash]) == null) {
        tempFilesStatus[fileNameHash] = [];
      }
      status = tempFilesStatus[fileNameHash];
      if (status === 'complete') {
        return next();
      } else {
        return fs.exists(file, function(exists) {
          if (exists) {
            return _.each(status, function(cbf) {
              return cbf();
            });
          } else {
            return status.push(next);
          }
        });
      }
    },
    /**
     * handle 处理函数（该方法可以处理的请求就返回true，否则返回false）
     * @param  {String}   pathname pathname
     * @param  {Function} next express router的next方法
     * @return {Boolean}
    */

    handle: function(pathname, next) {
      var self, tempFilePath;
      self = this;
      tempFilePath = self.getTempFilePath(pathname);
      if (tempFilePath) {
        self.completeHandle(tempFilePath, next);
        return true;
      } else {
        return false;
      }
    },
    /**
     * getTempFilePath 获取临时文件夹路径
     * @param  {[type]} pathname [description]
     * @return {[type]}          [description]
    */

    getTempFilePath: function(pathname) {
      var tempPrefix, tempPrefixLength, tempStaticPrefix;
      tempStaticPrefix = config.tempStaticPrefix;
      tempPrefix = tempStaticPrefix.replace(config.staticPrefix, '');
      tempPrefixLength = tempPrefix.length;
      if (pathname.substring(0, tempPrefixLength) === tempPrefix) {
        return pathname.substring(tempPrefixLength);
      } else {
        return '';
      }
    }
  };

  tempFileHandler.initEvent();

  module.exports = otherParser;

}).call(this);
