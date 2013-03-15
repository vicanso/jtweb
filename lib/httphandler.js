
/**!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
*/


(function() {
  var appendJsAndCss, httpHandler, jtUtil, mime, resIsAvailable, responseHTML, _;

  jtUtil = require('jtutil');

  mime = require('express').mime;

  _ = require('underscore');

  httpHandler = {
    /**
     * 模板处理方法
     * @param  {request} req  request
     * @param  {response} res  response
     * @param  {String} view 模板路径
     * @param  {Object} data 模板中使用到的一些数据
     * @return {[type]}      [description]
    */

    render: function(req, res, view, data) {
      var fileImporter;
      if (data) {
        fileImporter = data.fileImporter;
        console.dir("view:" + view);
        res.render(view, data, function(err, html) {
          if (err || !html) {
            console.error(err);
            return;
          }
          if (fileImporter) {
            html = appendJsAndCss(html, fileImporter);
          }
          if (resIsAvailable(res)) {
            return responseHTML(req, res, html);
          }
        });
      }
      return this;
    },
    /**
     * response 响应请求
     * @param  {request} req request
     * @param  {response} res response
     * @param  {Object, String, Buffer} data 响应的数据
     * @param  {Object} headerOptions 响应的头部
     * @return {[type]}               [description]
    */

    response: function(req, res, data, headerOptions) {
      if (resIsAvailable(res)) {
        if (headerOptions) {
          _.each(headerOptions, function(value, key) {
            return res.header(key, value);
          });
        }
        res.send(data);
      }
      return this;
    },
    json: function(req, res, data) {
      if (resIsAvailable(res)) {
        res.json(data);
      }
      return this;
    }
  };

  /**
   * appendJsAndCss 往HTML中插入js,css引入列表
   * @param  {String} html html内容（未包含通过FileImporter引入的js,css）
   * @param  {FileImporter} fileImporter FileImporter实例
   * @return {String} 已添加js,css的html
  */


  appendJsAndCss = function(html, fileImporter) {
    html = html.replace('<!--CSS_FILES_CONTAINER-->', fileImporter.exportCss(true));
    html = html.replace('<!--JS_FILES_CONTAINER-->', fileImporter.exportJs(true));
    return html;
  };

  /**
   * response 响应HTTP请求
   * @param  {request} req  request
   * @param  {response} res  response
   * @param  {String} html 要返回的html数据
   * @return {[type]}      [description]
  */


  responseHTML = function(req, res, html) {
    res.header('Content-Type', 'text/html');
    res.header('Cache-Control', 'public, max-age=300');
    res.header('Last-Modified', new Date());
    return res.send(html);
  };

  /**
     * resIsAvailable 判断response是否可用
     * @param  {response} res response对象
     * @return {Boolean}
  */


  resIsAvailable = function(res) {
    if (res.headerSent) {
      return false;
    } else {
      return true;
    }
  };

  module.exports = httpHandler;

}).call(this);
