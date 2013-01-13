###*!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
###

jtUtil = require 'jtutil'
mime = require('express').mime
_ = require 'underscore'

httpHandler = 
  ###*
   * 模板处理方法
   * @param  {request} req  request
   * @param  {response} res  response
   * @param  {String} view 模板路径
   * @param  {Object} data 模板中使用到的一些数据
   * @return {[type]}      [description]
  ###
  render : (req, res, view, data) ->
    if data
      fileImporter = data.fileImporter
      res.render view, data, (err, html) ->
        if err || !html
          console.error err
          return 
        if fileImporter
          html = appendJsAndCss html, fileImporter
        if jtUtil.resIsAvailable res
          responseHTML req, res, html
    return @
  ###*
   * response 响应请求
   * @param  {request} req request
   * @param  {response} res response
   * @param  {Object, String, Buffer} data 响应的数据
   * @param  {Object} headerOptions 响应的头部
   * @return {[type]}               [description]
  ###
  response : (req, res, data, headerOptions) ->
    if jtUtil.resIsAvailable res
      # contentType = mime.lookup req.url
      # if contentType 
      #   res.header 'Content-Type', contentType
      if headerOptions
        _.each headerOptions, (value, key) ->
          res.header key ,value
      res.send data
    return @
  json : (req, res, data) ->
    if jtUtil.resIsAvailable res
      res.json data
    return @

###*
 * appendJsAndCss 往HTML中插入js,css引入列表
 * @param  {String} html html内容（未包含通过FileImporter引入的js,css）
 * @param  {FileImporter} fileImporter FileImporter实例
 * @return {String} 已添加js,css的html
###
appendJsAndCss = (html, fileImporter) ->
  html = html.replace '<!--CSS_FILES_CONTAINER-->', fileImporter.exportCss true
  html = html.replace '<!--JS_FILES_CONTAINER-->', fileImporter.exportJs true
  return html

###*
 * response 响应HTTP请求，若浏览器支持gzip，则将数据以gzip的形式返回
 * @param  {request} req  request
 * @param  {response} res  response
 * @param  {String} html 要返回的html数据
 * @return {[type]}      [description]
###
responseHTML = (req, res, html) ->
  acceptEncoding = req.header 'accept-encoding'
  res.header 'Content-Type', 'text/html'
  res.header 'Cache-Control', 'public, max-age=300'
  res.header 'Last-Modified', new Date()
  if acceptEncoding
    if acceptEncoding.indexOf 'gzip' != -1
      zipFunc = 'gzip'
    else if acceptEncoding.indexOf 'deflate' != -1
      zipFunc = 'deflate'
    if zipFunc
      jtUtil[zipFunc] html, (err, gzipData) ->
        if err
          logger.error err
          res.send html
        else
          res.header 'Content-Encoding', zipFunc
          res.send gzipData
    else
      res.send html
  else
    res.send html

module.exports = httpHandler
