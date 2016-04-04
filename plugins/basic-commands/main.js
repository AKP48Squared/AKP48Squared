'use strict';
const MessageResponderPlugin = require('../../lib/MessageResponderPlugin');
const AKP48 = GLOBAL.AKP48 || null;

class BasicCommands extends MessageResponderPlugin {
  constructor() {
    super('BasicCommands', AKP48);
  }
}

BasicCommands.prototype.handleMessage = function (context) {
  if(context.text.startsWith('!')) {
    //respond with "TEST!"
    this._AKP48.sendMessage(context.instanceId, context.to, 'TEST!');
  }
};

module.exports = BasicCommands;
