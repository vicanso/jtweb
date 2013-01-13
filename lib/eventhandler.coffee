###*!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
###
events = require 'events'

eventList = {}

eventHandler = 
  getEvent : (name) ->
    eventObj = eventList[name]
    if eventObj
      return eventObj
    else
      return eventList[name] = new events.EventEmitter()


module.exports = eventHandler