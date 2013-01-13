httpHandler = require './httphandler'
_ = require 'underscore'
handlerList = {}
headerOptions = 
  'Cache-Control' : 'no-cache, no-store, max-age=0'
defaultNoCacheContent = ''

nocacheHandler =
  ###*
   * handler 返回用于处理非缓存信息的express middleware
   * @return {[type]} [description]
  ###
  handler : () ->
    return (req, res, next) ->
      appName = req._info?.appName
      handler = handlerList[appName]
      filter = handler?.filter || defaultFilter
      if filter req
        if handler
          handler.handle req, (text) ->
            if !handler.coverage && defaultHandler
              defaultHandler req, (defaultText) ->
                text += defaultText
                httpHandler.response req, res, text, headerOptions
            else
              httpHandler.response req, res, text, headerOptions
        else
          defaultHandler req, (defaultText) ->
            httpHandler.response req, res, defaultText, headerOptions
      else
        next()
  ###*
   * addHandler 添加app的web info处理方法
   * @param {String} appName  app的名字
   * @param {Boolean} {optional} coverage 是否复盖默认的实现
   * @param {Function} handle 处理函数
   * @param {Function} filter 判断该请求是否符合
  ###
  addHandler : (appName, coverage, handle, filter) ->
      if _.isFunction coverage
        handle = coverage
        coverage = false
      handlerList[appName] = 
        coverage : coverage
        handle : handle
        filter : filter
  ###*
   * set 设置nocache的一些默认配置
   * @param {String} key 设置的配置名称
   * @param {Function} value 配置的处理方法
  ###
  set : (key, value) ->
    switch key
      when 'defaultFilter' then if _.isFunction value
        defaultFilter = value
      when 'defaultHandler' then if _.isFunction value
        defaultHandler = value

defaultFilter = () ->
  return false
defaultHandler = (req, cbf) ->
  cbf ''
# defaultFilter = (req) ->
#   url = req.url
#   nocacheJsFile = '/nocacheinfo.js'
#   return url.substring(url.length - nocacheJsFile.length) == nocacheJsFile

# defaultHandler = (req, cbf) ->
#   cbf defaultNoCacheContent

module.exports = nocacheHandler
