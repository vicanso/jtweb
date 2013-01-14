
/**!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
*/


(function() {
  var config, fileMerger, fileMergerEvent, fs, jtUtil, mkdirp, path, tempFilesStatus, _;

  _ = require('underscore');

  path = require('path');

  fs = require('fs');

  mkdirp = require('mkdirp');

  config = require('../config');

  jtUtil = require('jtutil');

  fileMergerEvent = require('./eventhandler').getEvent('fileMergerEvent');

  tempFilesStatus = {};

  fileMerger = {
    /**
     * getMergeFile 根据当前文件返回合并对应的文件名，若该文件未被合并，则返回空字符串
     * @param  {String} file 当前文件
     * @param  {String} type 文件类型（css, js）
     * @return {String} 返回合并后的文件名
    */

    getMergeFile: function(file, type) {
      var mergeFile, searchFiles, self;
      self = this;
      mergeFile = '';
      if (type === 'css') {
        searchFiles = self.cssList;
      } else {
        searchFiles = self.jsList;
      }
      _.each(searchFiles, function(searchInfo) {
        var files;
        files = searchInfo.files;
        if (!mergeFile && (_.indexOf(files, file, true)) !== -1) {
          return mergeFile = searchInfo.name;
        }
      });
      return mergeFile;
    },
    /**
     * isMergeByOthers 该文件是否是由其它文件合并而来
     * @param  {String}  file 文件名
     * @return {Boolean}      [description]
    */

    isMergeByOthers: function(file) {
      var files, self;
      self = this;
      files = _.pluck(self.cssList, 'name').concat(_.pluck(self.jsList, 'name'));
      return _.indexOf(files, file) !== -1;
    },
    /**
     * mergeFilesBeforeRunning 合并文件(在程序运行之前，主要是把一些公共的文件合并成一个，减少HTTP请求)
     * @param  {Boolean} merging 是否真实作读取文件合并的操作（由于有可能有多个worker进程，因此只需要主进程作真正的读取，合并操作，其它的只需要整理合并列表）
     * @param {Array} mergeFiles 合并文件列表
     * @return {[type]}              [description]
    */

    mergeFilesBeforeRunning: function(merging, mergeFiles) {
      var self;
      self = this;
      _.each(mergeFiles, function(mergerInfo, mergerType) {
        var mergeList;
        if (_.isArray(mergerInfo)) {
          mergeList = [];
          _.each(mergerInfo, function(mergers) {
            return mergeList.push(mergers);
          });
          if (merging) {
            _.each(mergeList, function(mergers) {
              var content, saveFile;
              saveFile = path.join(config.staticPath, mergers.name);
              content = [];
              _.each(mergers.files, function(file, i) {
                return content.push(fs.readFileSync(path.join(config.staticPath, file), 'utf8'));
              });
              mkdirp(path.dirname(saveFile), function(err) {
                var fileSplit;
                if (err) {
                  console.error(err);
                }
                fileSplit = '';
                if (mergerType === 'js') {
                  fileSplit = ';';
                }
                return fs.writeFileSync(saveFile, content.join(fileSplit));
              });
              return mergers.files.sort();
            });
          }
          return self["" + mergerType + "List"] = mergeList;
        }
      });
      return self;
    },
    /**
     * mergeFilesToTemp 将文件合并到临时文件夹，合并的文件根据所有文件的文件名通过sha1生成，返回该文件名
     * @param  {Array} mergeFiles 合并文件列表
     * @param  {String} type 文件类型（用于作为文件后缀）
     * @return {String}            合并后的文件名
    */

    mergeFilesToTemp: function(mergeFiles, type) {
      var linkFileHash, linkFileName, saveFile;
      mergeFiles = _.filter(mergeFiles, function(file) {
        return fileMerger.getMergeFile(file, type) === '';
      });
      linkFileHash = jtUtil.sha1(mergeFiles.join(''));
      linkFileName = "" + linkFileHash + "." + type;
      saveFile = path.join(config.tempPath, linkFileName);
      if (tempFilesStatus[linkFileHash] === 'complete' || fs.existsSync(saveFile)) {

      } else {
        if (!tempFilesStatus[linkFileHash]) {
          tempFilesStatus[linkFileHash] = 'merging';
          jtUtil.mergeFiles(mergeFiles, saveFile, function(data, file, saveFile) {
            var ext, imagesPath;
            ext = path.extname(file);
            if (ext === '.less' || ext === '.css') {
              imagesPath = path.relative(path.dirname(saveFile), path.dirname(file));
              imagesPath = path.join(imagesPath, '../images');
              data = data.replace(/..\/images/g, imagesPath);
            } else if (ext === '.coffee' || ext === '.js') {
              data += ';';
            }
            return data;
          }, function(err) {
            if (err) {
              delete tempFilesStatus[linkFileHash];
              return console.error(err);
            } else {
              tempFilesStatus[linkFileHash] = 'complete';
              return fileMergerEvent.emit('complete', linkFileHash);
            }
          });
        }
      }
      return linkFileName;
    }
  };

  module.exports = fileMerger;

}).call(this);
