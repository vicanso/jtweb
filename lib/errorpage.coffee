###*!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
###

express = require 'express'
config = require '../config'
errorPage = 
  ###*
   * handler 返回错误信息处理函数
   * @return {Function} express middleware
  ###
  handler : (isProductionMode) ->
    if isProductionMode
      return (err, req, res) ->
        # TODO add production error page
        
    else
      return express.errorHandler {
        dumpExceptions : true
        showStack : true
      }
  ###*
   * error 返回错误对象
   * @param  {Number} status http状态码
   * @param  {String} msg    出错信息
   * @return {Error} Error对象
  ###
  error : (status, msg) ->
    err = new Error msg
    err.status = status
    return err

module.exports = errorPage
