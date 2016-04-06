'use strict';
const Plugin = require('./Plugin');
const PluginTypes = require('./PluginTypes');

class MessageHandlerPlugin extends Plugin {
  constructor(pluginName, AKP48) {
    super(pluginName, PluginTypes.MessageHandler, AKP48);
    var self = this;
    this._AKP48.on('cmd', function(message, context) {
      self.handleCommand(message, context);
    });

    this._AKP48.on('msg', function(message, context) {
      self.handleMessage(message, context);
    });
  }

  handleCommand() {
    return null;
  }

  handleMessage() {
    return null;
  }
}

module.exports = MessageHandlerPlugin;
