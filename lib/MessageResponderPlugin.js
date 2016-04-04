'use strict';
const Plugin = require('./Plugin');
const PluginTypes = require('./PluginTypes');

class MessageResponderPlugin extends Plugin {
  constructor(pluginName, AKP48) {
    super(pluginName, PluginTypes.MessageResponder, AKP48);
    var self = this;
    this._AKP48.on('msg', function(context) {
      self.handleMessage(context);
    });
  }

  handleMessage() {
    throw new Error('NotYetImplementedError');
  }
}

module.exports = MessageResponderPlugin;
