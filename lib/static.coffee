###*!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
###

express = require 'express'
config = require '../config'
staticHandler =
  ###*
   * handler 静态文件HTTP请求处理
   * @return {Function} 返回express的middleware
  ###
  handler : () ->
    staticPath = config.staticPath
    staticPrefix = config.staticPrefix
    staticPrefixLength = staticPrefix.length
    staticCompressHandler = express.compress {
      memLevel : 9
    }
    maxAge = 1
    if config.isProductionMode
      maxAge = config.fileMaxAge * 1000
    otherParser = require('./otherparser').parser staticPath
    handler = express.static "#{staticPath}", {
      maxAge : maxAge
      redirect : false
    }
    return (req, res, next) ->
      # 先判断该url是否静态文件的请求（请求的前缀固定），如果是则处理该请求（如果可以压缩的则压缩数据）
      if req.url.substring(0, staticPrefixLength) is staticPrefix
        req.url = req.url.substring staticPrefixLength
        staticCompressHandler req, res, () ->
          otherParser req, res, () ->
            handler req, res, next
      else
        next()
  
  
module.exports = staticHandler