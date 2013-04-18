###*!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
###
_ = require 'underscore'
appInfo = require './lib/appinfo'
session = require './lib/session'
nocacheHandler = require './lib/nocachehandler'
config = require './config'

initApp = (options) ->
  jtLogger = require 'jtlogger'
  jtUtil = require 'jtutil'
  express = require 'express'
  defaults = 
    viewEngine : 'jade'
  opts = _.extend defaults, options

  app = express()

  app.set 'view engine', opts.viewEngine
  app.set 'views', opts.viewsPath

  middleware.set {
    appPath : opts.appPath
    redisClient : opts.redisClient
  }

  if opts.firstMiddleware
    if !_.isArray opts.firstMiddleware
      opts.firstMiddleware = [opts.firstMiddleware]
    _.each opts.firstMiddleware, (firstMiddleware) ->
      app.use firstMiddleware


  # 静态文件处理
  if opts.staticSetting
    if !_.isArray opts.staticSetting
      opts.staticSetting = [opts.staticSetting]
    _.each opts.staticSetting, (staticSetting) ->
      if staticSetting.mountPath
        app.use staticSetting.mountPath, middleware.staticHandler staticSetting.path
      else
        app.use middleware.staticHandler staticSetting.path

  # favicon的处理
  if opts.faviconPath
    app.use express.favicon opts.faviconPath

  # express的middleware处理，在静态文件和favicon之后
  if opts.middleware
    if !_.isArray opts.middleware
      opts.middleware = [opts.middleware]
    _.each opts.middleware, (middleware) ->
      if middleware
        app.use middleware

  if opts.mode == 'production'
    app.use express.limit '1mb'
    app.use jtLogger.getConnectLogger 'HTTP-INFO-LOGGER', {
      format : express.logger.tiny
    }
  else
    app.use express.logger 'dev'


  app.use express.bodyParser()
  app.use express.methodOverride()

  # 每个应用的信息处理
  app.use middleware.infoParser()

  # 用于输出非缓存的信息处理（主要是个人信息）
  app.use middleware.nocacheInfoParser()

  app.use app.router

  # 错误页面处理输出
  app.use middleware.errorPageHandler()

  if opts.routeInfos
    routeHandler = middleware.routeHandler()
    routeHandler.initRoutes app, opts.routeInfos
  # if opts.routeFiles
  #   if !_.isArray opts.routeFiles
  #     opts.routeFiles = [opts.routeFiles]
  #   _.each opts.routeFiles, (routeFile) ->
  #     jtUtil.requireFileExists routeFile, (exists) ->
  #       if exists
  #         require(routeFile) app

  app.listen opts.port
  console.info "listen port #{opts.port}" 



initMongoDb = (dbConfigs) ->
  jtMongoDb = require 'jtmongodb'
  jtRedis = require 'jtredis'
  defaultConfig = 
    immediatelyInit : true
    options :
      w : 0
      native_parser : false
      auto_reconnect : true
      read_secondary : true
      readPreference : 'secondaryPreferred'
  if !_.isArray dbConfigs
    dbConfigs = [dbConfigs]
  _.each dbConfigs, (dbConfig, i) ->
    dbConfigs[i] = _.extend defaultConfig, dbConfig
  delete dbConfigs.cacheClient
  jtMongoDb.set {
    queryTime : true
    valiate : true
    timeOut : 0
    ttl : 300
    cacheClient : jtRedis.getClient()
    mongodb : dbConfigs
    logger : require('jtlogger').getLogger 'MONGODB'
  }

initRedis = (config) ->
  config = _.clone config
  jtRedis = require 'jtredis'
  jtRedis.setConfig {
    queryTime : true
    redis : config
  }


middleware = 
  initApp : initApp
  initMongoDb : initMongoDb
  initRedis : initRedis
  set : (options, args...) ->
    if _.isString options
      switch options
        when 'nocache' then nocacheHandler.set.apply nocacheHandler, args
    else if _.isObject options
      _.extend config, options
  staticHandler : (staticPath) ->
    return require('./lib/static').handler staticPath
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