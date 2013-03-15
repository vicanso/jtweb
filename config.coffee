###*!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
###
path = require 'path'
_ = require 'underscore'
# 运行文件的目录
appPath = path.dirname process.mainModule.filename

writableProperties =
  appPath : appPath
  # 静态文件目录
  staticPath : "#{appPath}/statics"
  tempStaticPrefix : '/statics/temp'
  # 合并文件的存放临时目录
  tempPath : "#{appPath}/statics/temp"
  # 静态文件的HTTP缓存时间（单位秒）
  fileMaxAge : 15 * 60
  dbCacheKeyPrefix : 'jtCache_'
  redisInfo : null

readonlyProperties =
  isMaster : require('cluster').isMaster || false
  isProductionMode : process.env.NODE_ENV is 'production'

config = {}

_.each writableProperties, (value, property) ->
  Object.defineProperty config, property, {
    enumerable : true
    configurable : false
    writable : true
    value : value
  }
_.each readonlyProperties, (value, property) ->
  Object.defineProperty config, property, {
    enumerable : true
    configurable : false
    writable : false
    value : value
  }

module.exports = config