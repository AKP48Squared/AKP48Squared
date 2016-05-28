'use strict';
const Plugin = require('./Plugin');
const PluginTypes = require('./PluginTypes');

class MessageHandlerPlugin extends Plugin {
  constructor(pluginName, AKP48, config) {
    super(pluginName, PluginTypes.MessageHandler, AKP48, config);
    var self = this;
    this._AKP48.on('cmd', function(message, context, resolve) {
      self.handleCommand(message, context, resolve);
    });

    this._AKP48.on('msg', function(message, context, resolve) {
      self.handleMessage(message, context, resolve);
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
