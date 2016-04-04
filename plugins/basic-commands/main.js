'use strict';
const MessageResponderPlugin = require('../../lib/MessageResponderPlugin');
const AKP48 = GLOBAL.AKP48 || null;

class BasicCommands extends MessageResponderPlugin {
  constructor() {
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

BasicCommands.prototype.handleMessage = function (context) {
  if(context.text.startsWith('!')) {
    // prepare text.
    var text = context.text.slice(1);
    text = text.split(' ');
    var command = text[0];
    text.shift();

    context.text = text.join(' ');
    context.command = command;

    for (var cmd in this.commands) {
      if (this.commands.hasOwnProperty(cmd)) {
        if(this.commands[cmd].names.includes(command)) {
          this._AKP48.sendMessage(context.instanceId, context.to, this.commands[cmd].respond(context));
        }
      }
    }
  }
};

module.exports = BasicCommands;
