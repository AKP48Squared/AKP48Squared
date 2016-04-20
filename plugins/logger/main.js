'use strict';
const MessageHandlerPlugin = require('../../lib/MessageHandlerPlugin');
var c = require('irc-colors');

class Logger extends MessageHandlerPlugin {
  constructor(AKP48) {
    super('Logger', AKP48);

    this._AKP48.on('sendMsg', this.handleSentMessage);
    this._AKP48.on('fullMsg', this.handleFullMessage);
  }
}

Logger.prototype.handleMessage = function (message, context, res) {
  res(false);
};

Logger.prototype.handleFullMessage = function (message, context) {
  var out = `<=== ${context.instanceId}:${context.to} | ${context.nick} | ${c.stripColorsAndStyle(message)}`;
  GLOBAL.logger.debug(out);
};

Logger.prototype.handleSentMessage = function (to, message, context) {
  var xtra = '';
  if(context.isEmote) {xtra = '/me ';}
  var out = `===> ${context.instanceId}:${to} | ${(context.myNick ? context.myNick + ' | ' : '')}${xtra}${c.stripColorsAndStyle(message)}`;
  setTimeout(function(){GLOBAL.logger.debug(out);},1); // Send to console after one millisecond,
  // because for some reason, sent messages are being handled faster than received messages.
  // This may be because of how the event listeners are working, but I'm not sure.
};

module.exports = Logger;
