'use strict';
const MessageHandlerPlugin = require('../../lib/MessageHandlerPlugin');

class Logger extends MessageHandlerPlugin {
  constructor(AKP48) {
    super('Logger', AKP48);

    this._AKP48.on('sendMsg', this.handleSentMessage);
  }
}

Logger.prototype.handleMessage = function (message, context) {
  var out = `<=== ${context.instanceId}:${context.to} | ${context.nick} | ${message}`;
  GLOBAL.logger.debug(out);
};

Logger.prototype.handleSentMessage = function (to, message, context) {
  var xtra = '';
  if(context.isEmote) {xtra = '/me ';}
  var out = `===> ${context.instanceId}:${to} | ${(context.myNick ? context.myNick + ' | ' : '')}${xtra}${message}`;
  setTimeout(function(){GLOBAL.logger.debug(out);},1); // Send to console after one millisecond,
  // because for some reason, sent messages are being handled faster than received messages.
  // This may be because of how the event listeners are working, but I'm not sure.
};

module.exports = Logger;
