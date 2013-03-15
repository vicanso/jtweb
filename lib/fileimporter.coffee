###*!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
###

_ = require 'underscore'
path = require 'path'
fs = require 'fs'

config = require '../config'
fileMerger = require './filemerger'

VERSION = Math.floor Date.now() / 120000


class FileImporter
  ###*
   * constructor 文件引入类
   * @param  {Boolean} debug 是否debug模式，debug模式下将.min.js替换为.js
   * @param  {String} host 静态文件的host
   * @return {FileImporter}       [description]
  ###
  constructor : (debug, @host) ->
    @cssFiles = []
    @jsFiles = []
    @debug = debug || false
  ###*
   * importCss 引入css文件
   * @param  {String} path     css路径
   * @param  {Boolean} {optioanl} prepend 是否插入到数组最前（在HTML中首先输出）
   * @return {FileImporter}         [description]
  ###
  importCss : (path, prepend) ->
    self = @
    self.importFiles path, 'css', prepend
    return self
  ###*
   * importJs 引入js文件
   * @param  {String} path    js路径
   * @param  {Boolean} {optioanl} prepend [是否插入到数组最前（在HTML中首先输出）]
   * @return {FileImporter}         [description]
  ###
  importJs : (path, prepend) ->
    self = @
    self.importFiles path, 'js', prepend
    return self
  ###*
   * importFiles 引入文件
   * @param  {String} path    文件路径
   * @param  {String} type    文件类型(css, js)
   * @param  {Boolean} {optioanl} prepend 是否插入到数组最前（在HTML中首先输出）
   * @return {FileImporter}         [description]
  ###
  importFiles : (path, type, prepend) ->
    self = @
    if _.isString path
      path = path.trim()
      if not self.debug
        mergerFile = fileMerger.getMergeFile path, type
        if mergerFile
          path = mergerFile
      if type is 'css'
        if _.indexOf(self.cssFiles, path) is -1
          if prepend
            self.cssFiles.unshift path
          else
            self.cssFiles.push path
      else if _.indexOf(self.jsFiles, path) is -1
        if prepend
          self.jsFiles.unshift path
        else
          self.jsFiles.push path
    else if _.isArray path
      if prepend
        path.reverse()
      _.each path, (item) ->
        self.importFiles item, type, prepend
    return self
  ###*
   * exportCss 输出CSS标签
   * @param  {Boolean} merge 是否合并css文件
   * @return {String} 返回css标签
  ###
  exportCss : (merge) ->
    self = @
    return getExportFilesHTML self.cssFiles, 'css', self.debug, merge, @host
  ###*
   * exportJs 输出JS标签
   * @param  {Boolean} merge 是否合并js文件
   * @return {String} 返回js标签
  ###
  exportJs : (merge) ->
    self = @
    return getExportFilesHTML self.jsFiles, 'js', self.debug, merge, @host

###*
 * getExportFilesHTML 获取引入文件列表对应的HTML
 * @param  {Array} files 引入文件列表
 * @param  {String} type  引入文件类型，现支持css, js
 * @param  {Boolean} debug 是否debug模式
 * @param  {Boolean} merge 是否需要合并文件
 * @param  {String} host 静态文件的host
 * @return {String} 返回html标签内容
###
getExportFilesHTML = (files, type, debug, merge, host) ->
  exportAllFilesHTML = []
  exportMergeFilesHTML = []
  mergeFiles = []
  _.each files, (file) ->
    suffix = true
    isMerge = false
    if isFilter file
      suffix = false
    else
      if debug && type == 'js'
        file = file.replace '.min.js', '.js'
      if !fileMerger.isMergeByOthers file
        mergeFiles.push path.join config.staticPath, file
        isMerge = true
      # file = path.join config.staticPrefix, file
    exportHTML = getExportHTML file, type, suffix, host
    if !isMerge
      exportMergeFilesHTML.push exportHTML
    exportAllFilesHTML.push exportHTML

  if !merge || debug || mergeFiles.length == 0
    return exportAllFilesHTML.join ''
  linkFileName = fileMerger.mergeFilesToTemp mergeFiles, type
  console.dir 'eeee'
  if linkFileName
    linkFileName = path.join config.tempStaticPrefix, linkFileName
    exportHTML = getExportHTML linkFileName, type, '?mergefile=true', host
    exportMergeFilesHTML.push exportHTML
    return exportMergeFilesHTML.join ''
  else
    return exportAllFilesHTML.join ''

###*
 * isFilter 判断该文件是否应该过滤的
 * @param  {String}  file 引入文件路径
 * @return {Boolean}      [description]
###
isFilter = (file) ->
  filterPrefix = 'http'
  if file.substring(0, filterPrefix.length) == filterPrefix
    return true
  else
    return false

###*
 * getExportHTML 返回生成的HTML
 * @param  {String} file   引入的文件
 * @param  {String} type   文件类型
 * @param  {Boolean} suffix 是否需要添加后缀（主要是为了增加版本好，用时间作区分）
 * @param  {String} host 静态文件的host
 * @return {String} 返回相应的html
###
getExportHTML = (file, type, suffix, host) ->
  html = ''
  switch type
    when 'js' then html = exportJsHTML file, suffix, host
    else html = exportCssHTML file, suffix, host
  return html

###*
 * exportJsHTML 返回引入JS的标签HTML
 * @param  {String} file   引入的文件
 * @param  {Boolean, String} suffix 是否需要版本后缀
 * @return {String} 返回相应的html
###
exportJsHTML = (file, suffix, host) ->
  if suffix
    if _.isBoolean
      file += "?version=#{VERSION}"
    else
      file += suffix
  if host && file.indexOf('http') != 0
    file = host + file
  return '<script type="text/javascript" src="' + file + '"></script>'

###*
 * exportCssHTML 返回引入CSS标签的HTML
 * @param  {String} file   引入的文件
 * @param  {Boolean} suffix 是否需要版本后缀
 * @return {String} 返回相应的html
###
exportCssHTML = (file, suffix, host) ->
  if suffix
    if _.isBoolean
      file += "?version=#{VERSION}"
    else
      file += suffix
  if host && file.indexOf('http') != 0
    file = host + file
  return '<link rel="stylesheet" href="' + file + '" type="text/css" media="screen" />'


module.exports = FileImporter
