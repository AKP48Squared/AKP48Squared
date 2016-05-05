'use strict';
// const MessageHandlerPlugin = require('../../lib/MessageHandlerPlugin');
const BasicCommands = require('akp48-plugin-basic-commands');

class IRCCommands extends BasicCommands {
  constructor(AKP48) {
    super(AKP48);
    this._data = require('./plugin.json');
    //manually override pluginName, since we're extending another plugin.
    this._pluginName = 'IRCCommands';
    var self = this;
    this.commands = {};
    require('./commands').then(function(res){
      self.commands = res;
    }, function(err){
      console.error(err);
    });
  }

  handleCommand(message, context, resolve) {
    global.logger.silly(`${this._pluginName}: Received command.`);
    // if this isn't an IRC instance, drop the command.
    if(!context.instanceType || context.instanceType !== 'irc') {
      global.logger.silly(`${this._pluginName}: Dropping command; not IRC instance.`);
      return;
    }

    //run the handleCommand logic from BasicCommands, which should use our defined commands instead.
    global.logger.silly(`${this._pluginName}: Attempting to handle command using BasicCommands logic.`);
    super.handleCommand(message, context, resolve);
  }
}

module.exports = IRCCommands;
