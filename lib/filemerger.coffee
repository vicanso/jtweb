###*!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
###

_ = require 'underscore'
path = require 'path'
fs = require 'fs'
mkdirp = require 'mkdirp'
config = require '../config'
jtUtil = require 'jtutil'
fileMergerEvent = require('./eventhandler').getEvent 'fileMergerEvent'

tempFilesStatus = {}

fileMerger = 
  ###*
   * getMergeFile 根据当前文件返回合并对应的文件名，若该文件未被合并，则返回空字符串
   * @param  {String} file 当前文件
   * @param  {String} type 文件类型（css, js）
   * @return {String} 返回合并后的文件名
  ###
  getMergeFile : (file, type) ->
    self = @
    mergeFile = ''
    if type is 'css'
      searchFiles = self.cssList
    else
      searchFiles = self.jsList
    _.each searchFiles, (searchInfo) ->
      files = searchInfo.files
      if !mergeFile && (_.indexOf files, file, true) != -1
        mergeFile = searchInfo.name
    return mergeFile
  ###*
   * isMergeByOthers 该文件是否是由其它文件合并而来
   * @param  {String}  file 文件名
   * @return {Boolean}      [description]
  ###
  isMergeByOthers : (file) ->
    self = @
    files = _.pluck(self.cssList, 'name').concat _.pluck self.jsList, 'name'
    return _.indexOf(files, file) != -1
  ###*
   * mergeFilesBeforeRunning 合并文件(在程序运行之前，主要是把一些公共的文件合并成一个，减少HTTP请求)
   * @param  {Boolean} merging 是否真实作读取文件合并的操作（由于有可能有多个worker进程，因此只需要主进程作真正的读取，合并操作，其它的只需要整理合并列表）
   * @param {Array} mergeFiles 合并文件列表
   * @return {[type]}              [description]
  ###
  mergeFilesBeforeRunning : (merging, mergeFiles) ->
    self = @
    _.each mergeFiles, (mergerInfo, mergerType) ->
      if _.isArray mergerInfo
        mergeList = []
        _.each mergerInfo, (mergers) ->
          mergeList.push mergers
        if merging
          _.each mergeList, (mergers) ->
            saveFile = path.join config.staticPath, mergers.name
            content = []
            _.each mergers.files, (file, i) ->
              content .push fs.readFileSync path.join(config.staticPath, file), 'utf8'
            mkdirp path.dirname(saveFile), (err) ->
              if err
                console.error err
              fileSplit = ''
              if mergerType == 'js'
                fileSplit = ';'
              fs.writeFileSync saveFile, content.join fileSplit
            mergers.files.sort()
        self["#{mergerType}List"] = mergeList
    return self

  ###*
   * mergeFilesToTemp 将文件合并到临时文件夹，合并的文件根据所有文件的文件名通过sha1生成，返回该文件名
   * @param  {Array} mergeFiles 合并文件列表
   * @param  {String} type 文件类型（用于作为文件后缀）
   * @return {String}            合并后的文件名
  ###
  mergeFilesToTemp : (mergeFiles, type) ->
    #已提前作合并的文件不再作合并
    mergeFiles = _.filter mergeFiles, (file) ->
      return fileMerger.getMergeFile(file, type) == ''
    linkFileHash = jtUtil.sha1 mergeFiles.join ''
    linkFileName = "#{linkFileHash}.#{type}" 

    saveFile = path.join config.tempPath, linkFileName
    # 判断该文件是否已成生成好，若生成好，HTML直接加载该文件
    if tempFilesStatus[linkFileHash] == 'complete' || fs.existsSync saveFile
    else
      # 判断是否该文件正在合并中，若正在合并，则直接返回空字符串。若不是，则调用合并，并在状态记录中标记为merging
      if !tempFilesStatus[linkFileHash]
        tempFilesStatus[linkFileHash] = 'merging'
        jtUtil.mergeFiles mergeFiles, saveFile, (data, file, saveFile) ->
          ext = path.extname file
          if ext == '.less' || ext == '.css' || ext == '.styl'
            imagesPath = path.relative path.dirname(saveFile), path.dirname(file)
            imagesPath = path.join imagesPath, '../images'
            data = data.replace /..\/images/g, imagesPath.replace /\\/g, '\/'
          else if ext == '.coffee' || ext == '.js'
            data += ';'
          return data
        ,(err) ->
          if err
            delete tempFilesStatus[linkFileHash]
            console.error err
          else
            tempFilesStatus[linkFileHash] = 'complete'
            fileMergerEvent.emit 'complete', linkFileHash

    return linkFileName

module.exports = fileMerger
