'use strict';
const MessageHandlerPlugin = require('../../lib/MessageHandlerPlugin');
const regexes = require('./regexes');

class LinkHandler extends MessageHandlerPlugin {
  constructor(AKP48) {
    super('LinkHandler', AKP48);
  }
}

LinkHandler.prototype.handleMessage = function (message, context, res) {
  global.logger.stupid(`${this._pluginName}: Received message.`);
  res(false);

  //check message to see if it matches a weblink.
  if(regexes.weburl.test(message)) {
    var match = regexes.weburl.exec(message);
    var limit = 0;
    while (match !== null && limit < 3) {
      this.handleLink(match[0], context);
      match = regexes.weburl.exec(message);
      limit++;
    }
  }
};

LinkHandler.prototype.handleLink = function (url, context) {
  global.logger.silly(`${this._pluginName}: Attempting to handle link.`);
  this._AKP48.sendMessage(context.instanceId, context.to, `I found a link! It's '${url}'.`, context);
};

module.exports = LinkHandler;
