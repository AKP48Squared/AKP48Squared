'use strict';
const Plugin = require('./Plugin');

class MessageHandlerPlugin extends Plugin {
  init(...args) {
    super.init(...args);
    this._AKP48.on('cmd', this.handleCommand.bind(this));
    this._AKP48.on('msg', this.handleMessage.bind(this));
  }

  handleCommand() {
    return;
  }

  handleMessage() {
    return;
  }
}

module.exports = MessageHandlerPlugin;
