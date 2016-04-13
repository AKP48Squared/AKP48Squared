'use strict';
const MessageHandlerPlugin = require('../../lib/MessageHandlerPlugin');
const regexes = require('./regexes');

class LinkHandler extends MessageHandlerPlugin {
  constructor(AKP48) {
    super('LinkHandler', AKP48);
  }
}

LinkHandler.prototype.handleMessage = function (message, context) {
  GLOBAL.logger.silly(`${this._pluginName}: Received message.`);

  //check message to see if it matches a weblink.
  if(regexes.weburl.test(message)) {
    this._AKP48.sendMessage(context.instanceId, context.to, `That's a web link!`, context);
  }
};

module.exports = LinkHandler;
