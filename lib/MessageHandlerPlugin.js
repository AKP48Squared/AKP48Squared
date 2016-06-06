'use strict';
const Plugin = require('./Plugin');

class MessageHandlerPlugin extends Plugin {
  init(...args) {
    super.init(...args);
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
