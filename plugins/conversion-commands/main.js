'use strict';
const ConvertBase = require('./ConvertBase');
const ConvertTemp = require('./ConvertTemp');
const MessageHandlerPlugin = require('../../lib/MessageHandlerPlugin');
const Qty = require('js-quantities');

class Conversion extends MessageHandlerPlugin {
  constructor(AKP48) {
    super('Conversion', AKP48);
  }
}

Conversion.prototype.handleCommand = function (message, context, res) {
  GLOBAL.logger.silly(`${this._pluginName}: Received command.`);

  // prepare text.
  context.originalText = context.text;
  var text = context.text.split(' ');
  var command = text[0];
  //text is now an array of all the arguments the user sent.
  text.shift();
  var responses = [];

  if(typeof ConvertBase[command] === 'function') {
    GLOBAL.logger.silly(`${this._pluginName}: Responding to ${command} command.`);
    for (var i = 0; i < text.length; i++) {
      responses.push(`${text[i]} => ${ConvertBase[command](text[i])}`);
    }

    res(responses.join(', '));
  }

  if(typeof ConvertTemp[command] === 'function') {
    GLOBAL.logger.silly(`${this._pluginName}: Responding to ${command} command.`);
    for (var i = 0; i < text.length; i++) {
      responses.push(`${ConvertTemp[command](text[i])}`);
    }
    res(responses.join(', '));
  }

  //all-in-one solution time.
  if(command === 'convert') {
    var to = text[0];
    text.shift();
    try {
      for (var i = 0; i < text.length; i++) {
        var q = new Qty(text[i]);
        if(q.isCompatible(to)) {
          responses.push(`${q.toPrec(0.01).toString()} => ${q.to(to).toPrec(0.01).toString()}`);
        } else {
          responses.push(`Incompatible units: ${q.toPrec(0.01).toString()}`);
        }
      }
    } catch(e) {
      responses.push(`Error! ${e.message}.`);
    }

    res(responses.join(', '));
  }
};

module.exports = Conversion;
