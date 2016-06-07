'use strict';
const Plugin = require('./Plugin');

class MessageHandlerPlugin extends Plugin {
  init(...args) {
    super.init(...args);
    this._AKP48.on('cmd', (c) => { this.handleCommand(c.clone()); });
    this._AKP48.on('msg', (c) => { this.handleMessage(c.clone()); });
  }

  handleCommand() {
    return;
  }

  handleMessage() {
    return;
  }
}

module.exports = MessageHandlerPlugin;
