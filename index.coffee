###*!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
###
_ = require 'underscore'
appInfo = require './lib/appinfo'
session = require './lib/session'
nocacheHandler = require './lib/nocachehandler'
config = require './config'
middleware = 
  set : (options, args...) ->
    if _.isString options
      switch options
        when 'nocache' then nocacheHandler.set.apply nocacheHandler, args
    else if _.isObject options
      _.extend config, options
  staticHandler : () ->
    return require('./lib/static').handler()
  sessionParser : () ->
    return session.parser()
  infoParser : () ->
    return appInfo.parser()
  fileImporter : () ->
    return require './lib/fileimporter'
  fileMerger : () ->
    return require './lib/filemerger'
  nocacheHandlerSet : (key, value) ->
  addInfoParser : (parser) ->
    if _.isFunction parser
      appInfo.addParser parser
  addSessionConfig : (appName, redisOptions, options) ->
    if appName && redisOptions
      session.addConfig appName, redisOptions, options
  addNocacheInfoParser : (args...) ->
    nocacheHandler.addHandler.apply nocacheHandler, args
  httpHandler : () ->
    return require './lib/httphandler'
  routeHandler : () ->
    return require './lib/routehandler'
  nocacheInfoParser : () ->
    return nocacheHandler.handler()
  errorPageHandler : () ->
    return require('./lib/errorpage').handler()
    

module.exports = middleware