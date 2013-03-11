###*!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
###

express = require 'express'
async = require 'async'
config = require '../config'
staticHandler =
  ###*
   * handler 静态文件HTTP请求处理
   * @return {Function} 返回express的middleware
  ###
  handler : (staticPath, staticPrefix) ->
    staticPath ?= config.staticPath
    staticPrefix ?= config.staticPrefix
    staticPrefixLength = staticPrefix.length
    tempStaticPrefix = config.tempStaticPrefix
    tempStaticPrefixLength = tempStaticPrefix.length
    # staticCompressHandler = express.compress {
    #   memLevel : 9
    # }
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
      if req.url.substring(0, staticPrefixLength) == staticPrefix
        if req.url.substring(0, tempStaticPrefixLength) == tempStaticPrefix
          isTempFile = true
        req.url = req.url.substring staticPrefixLength
        if isTempFile
          path = require 'path'
          tempFile = path.join(staticPath, req.url).replace /\?version=\d*/, ''
          tempFileHandle tempFile, () ->
            handler req, res, next
        else
          otherParser req, res, () ->
            handler req, res, next
        # staticCompressHandler req, res, () ->
        #   otherParser req, res, () ->
        #     handler req, res, next
      else
        next()
###*
 * tempFileHandle 临时文件夹的文件处理
 * @param  {String} file 文件名
 * @param  {Function} cbf 回调函数
 * @return {[type]}      [description]
###
tempFileHandle = (file, cbf) ->
  fs = require 'fs'
  count = 0
  async.whilst () ->
    return count < 5
  , (cbf) ->
    fs.exists file, (exists) ->
      if exists
        count = 5
        cbf()
      else
        count++
        GLOBAL.setTimeout cbf, 50
  , (err) ->
    cbf()

module.exports = staticHandler