
/**!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
*/


(function() {
  var appInfo, defaultAppInfo, parserList, _;

  _ = require('underscore');

  parserList = [];

  defaultAppInfo = {
    app: 'all'
  };

  appInfo = {
    /**
     * parser 转换app信息的函数处理（会顺序的调用处理函数列表，如果某一函数有返回结果，则处理完成。否则，返回默认的配置信息）
     * @return {Function} express middleware 处理函数
    */

    parser: function() {
      return function(req, res, next) {
        var _info;
        if (req._info) {
          console.warn('Warning: the property _info of req');
          console.warn('is exist, the middle will cover the property.');
          console.warn('');
        }
        _info = null;
        _.each(parserList, function(parser) {
          if (!_info) {
            return _info = parser(req);
          }
        });
        if (_info == null) {
          _info = defaultAppInfo;
        }
        Object.defineProperty(req, '_info', {
          enumerable: false,
          configurable: false,
          writable: false,
          value: _info
        });
        return next();
      };
    },
    /**
     * addParser 添加app信息的parser函数
     * @param {Function} func app信息的处理函数
    */

    addParser: function(func) {
      if (_.isFunction(func)) {
        return parserList.push(func);
      }
    }
  };

  module.exports = appInfo;

}).call(this);
