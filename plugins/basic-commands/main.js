'use strict';
const MessageHandlerPlugin = require('../../lib/MessageHandlerPlugin');

class BasicCommands extends MessageHandlerPlugin {
  constructor(AKP48) {
    super('BasicCommands', AKP48);
    var self = this;
    this.commands = {};
    require('./commands').then(function(res){
      self.commands = res;
    }, function(err){
      console.error(err);
    });
  }
}

BasicCommands.prototype.handleCommand = function (message, context) {
  GLOBAL.logger.silly(`${this._pluginName}: Received command.`);

  // prepare text.
  context.originalText = context.text;
  var text = context.text.split(' ');
  var command = text[0];
  text.shift();

  context.text = text.join(' ');
  context.command = command;

  for (var cmd in this.commands) {
    if (this.commands.hasOwnProperty(cmd)) {
      GLOBAL.logger.silly(`${this._pluginName}: Checking ${cmd} command for ${command}.`);
      if(this.commands[cmd].names.includes(command.toLowerCase())) {
        GLOBAL.logger.silly(`${this._pluginName}: Found command for ${command}.`);
        this._AKP48.sendMessage(context.instanceId, context.to, this.commands[cmd].respond(context), context);
      }
    }
  }

  context.text = context.originalText;
};

module.exports = BasicCommands;
