'use strict';
const MessageHandlerPlugin = require('../../lib/MessageHandlerPlugin');
const chance = new (require('chance'))();

class AyyLmao extends MessageHandlerPlugin {
  constructor(AKP48) {
    super('AyyLmao', AKP48);
  }
}

AyyLmao.prototype.handleMessage = function (message, context, res) {
  GLOBAL.logger.silly(`${this._pluginName}: Received message.`);
  if(message.toLowerCase().includes('ayy')) {
    context.noPrefix = true;
    this._AKP48.sendMessage((chance.bool({likelihood: 25}) ? 'ayy lamo' : 'ayy lmao'), context);
    res(false);
  }
};

module.exports = AyyLmao;
