express = require 'express'
path = require 'path'
jtUtil = require 'jtutil'
_ = require 'underscore'
config = require '../config'
express.mime.types['less'] = 'text/css'
express.mime.types['coffee'] = 'application/javascript'



otherParser = 
  ###*
   * parser 其它类型的paser处理
   * @param  {String} staticPath 静态文件目录
   * @return {[type]}            [description]
  ###
  parser : (staticPath) ->
    url = require 'url'
    parseExts = ['.less', '.coffee']
    return (req, res, next) ->
      pathname = url.parse(req.url).pathname
      ext = path.extname pathname
      if config.isProductionMode && tempFileHandler.handle pathname, next
      else 
        if ~_.indexOf parseExts, ext
          write = res.write
          end = res.end
          bufList = []
          bufLength = 0
          res.write = (chunk, encoding) ->
            bufList.push chunk
            bufLength += chunk.length
          res.end = (chunk, encoding) ->
            if Buffer.isBuffer chunk
              bufList.push chunk
              bufLength += chunk.length
            buf = Buffer.concat bufList, bufLength
            file = path.join staticPath, pathname
            handle file, buf.toString(encoding), (err, data) ->
              if err
                throw err
              else
                buf = new Buffer data, encoding
                write.call res, buf, encoding
                return end.call res, chunk, encoding
        next()

###*
 * handle 处理方法（现有处理less,coffee）
 * @param  {String} file 文件名
 * @param  {String} data 文件数据
 * @param  {Function} cbf 回调函数
 * @return {[type]}      [description]
###
handle = (file, data, cbf) ->
  ext = path.extname file
  switch ext
    when '.less' then parseLess file, data, cbf
    when '.coffee' then parseCoffee file, data, cbf

###*
 * parseLess less编译
 * @param  {String} file 文件名
 * @param  {String} data 文件数据
 * @param  {Function} cbf  回调函数
 * @return {[type]}      [description]
###
parseLess = (file, data, cbf) ->
  options = 
    paths : [path.dirname file]
    filename : file
  if config.isProductionMode
    options.compress = true
  jtUtil.parseLess data, options, cbf

###*
 * parseCoffee coffee编译
 * @param  {String} file 文件名
 * @param  {String} data 文件数据
 * @param  {Function} cbf 回调函数
 * @return {[type]}      [description]
###
parseCoffee = (file, data, cbf) ->
  if config.isProductionMode
    options = 
      fromString : true
      warnings : true
  jtUtil.parseCoffee data, options, (err, jsStr) ->
    if err
      err.file = file
    cbf err, jsStr


# tempFilesStatus = {}
# initFileMergerEvent = () ->
#   fileMergerEvent = require('./eventhandler').getEvent 'fileMergerEvent'
#   fileMergerEvent.on 'complete', (fileNameHash) ->
#     tempFilesStatus[fileNameHash] ?= {}

#     tempFilesStatus[fileNameHash] = 'complete'
# initFileMergerEvent()

tempFileHandler = 
  tempFilesStatus : {}
  ###*
   * initEvent 初始化事件
   * @return {[type]} [description]
  ###
  initEvent : () ->
    self = @
    fileMergerEvent = require('./eventhandler').getEvent 'fileMergerEvent'
    fileMergerEvent.on 'complete', (fileNameHash) ->
      tempFilesStatus = self.tempFilesStatus
      status = tempFilesStatus[fileNameHash]
      _.each status, (cbf) ->
        cbf()
      tempFilesStatus[fileNameHash] = 'complete'
  ###*
   * completeHandle 判断文件是否已经完成，作相应的处理
   * @param  {String}   file 文件名
   * @param  {Function} next express router的next方法
   * @return {Boolean}       [description]
  ###
  completeHandle : (file, next) ->
    self = @
    file = path.join config.tempPath, file
    ext = path.extname file
    fileNameHash = path.basename file, ext
    tempFilesStatus = self.tempFilesStatus
    tempFilesStatus[fileNameHash] ?= []
    status = tempFilesStatus[fileNameHash]
    if status == 'complete'
      next()
    else
      fs.exists file, (exists) ->
        if exists
          _.each status, (cbf) ->
            cbf()
        else
          status.push next
  ###*
   * handle 处理函数（该方法可以处理的请求就返回true，否则返回false）
   * @param  {String}   pathname pathname
   * @param  {Function} next express router的next方法
   * @return {Boolean} 
  ###
  handle : (pathname, next) ->
    self = @
    tempFilePath = self.getTempFilePath pathname
    if tempFilePath
      self.completeHandle tempFilePath, next
      return true
    else
      return false
  ###*
   * getTempFilePath 获取临时文件夹路径
   * @param  {[type]} pathname [description]
   * @return {[type]}          [description]
  ###
  getTempFilePath : (pathname) ->
    tempStaticPrefix = config.tempStaticPrefix
    tempPrefix = tempStaticPrefix.replace config.staticPrefix, ''
    tempPrefixLength = tempPrefix.length
    if pathname.substring(0, tempPrefixLength) == tempPrefix
      return pathname.substring tempPrefixLength
    else
      return ''
tempFileHandler.initEvent()

module.exports = otherParser