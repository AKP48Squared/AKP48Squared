'use strict';
const ConvertBase = require('./ConvertBase');
const MessageHandlerPlugin = require('../../lib/MessageHandlerPlugin');

class BaseConversion extends MessageHandlerPlugin {
  constructor(AKP48) {
    super('BaseConversion', AKP48);
  }
}

BaseConversion.prototype.handleCommand = function (message, context) {
  GLOBAL.logger.silly(`${this._pluginName}: Received command.`);

  // prepare text.
  context.originalText = context.text;
  var text = context.text.split(' ');
  var command = text[0];
  //text is now an array of all the arguments the user sent.
  text.shift();

  if(typeof ConvertBase[command] === 'function') {
    GLOBAL.logger.silly(`${this._pluginName}: Responding to ${command} command.`);
    var responses = [];
    for (var i = 0; i < text.length; i++) {
      responses.push(`${text[i]} => ${ConvertBase[command](text[i])}`);
    }

    this._AKP48.sendMessage(context.instanceId, context.to, responses.join(', '), context);
  }
};

module.exports = BaseConversion;
