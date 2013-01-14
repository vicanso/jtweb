
/**!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
*/


(function() {
  var eventHandler, eventList, events;

  events = require('events');

  eventList = {};

  eventHandler = {
    getEvent: function(name) {
      var eventObj;
      eventObj = eventList[name];
      if (eventObj) {
        return eventObj;
      } else {
        return eventList[name] = new events.EventEmitter();
      }
    }
  };

  module.exports = eventHandler;

}).call(this);
