'use strict';
const Plugin = require('./Plugin');
const PluginTypes = require('./PluginTypes');

class MessageHandlerPlugin extends Plugin {
  init(config, dir) {
    super.init(config, dir);
    this._AKP48.on('cmd', this.handleCommand);
    this._AKP48.on('msg', this.handleMessage);
  }

  handleCommand() {
    return null;
  }

  handleMessage() {
    return null;
  }
}

module.exports = MessageHandlerPlugin;
