'use strict';
const MessageHandlerPlugin = require('../../lib/MessageHandlerPlugin');
const jf = require('jsonfile');
const path = require('path');

class Custom extends MessageHandlerPlugin {
  constructor(AKP48) {
    super('Custom Commands', AKP48);
    try {
      this.commands = require('./commands.json');
    } catch(e) {
      GLOBAL.logger.error(`${this._pluginName}: Error loading commands. Check your JSON for errors.`);
      this.commands = [];
    }
  }
}

Custom.prototype.handleCommand = function (message, context, res) {
  GLOBAL.logger.silly(`${this._pluginName}: Received command.`);

  // prepare text.
  context.originalText = context.text;
  var text = context.text.split(' ');
  var command = text[0];
  text.shift();

  context.text = text.join(' ');
  context.command = command;

  if(command.toLowerCase === 'addcustom') {
    res(this.addCustom(context));
  }

  if(command.toLowerCase === 'rmcustom') {
    res(this.rmCustom(context));
  }

  for (var i = 0; i < this.commands.length; i++) {
    var cmd = this.commands[i];
    if(cmd.name.toLowerCase() === command.toLowerCase() &&
       cmd.instanceId === context.instanceId && cmd.channel === context.to) {

      var out = this.commands[i].response;

      if(context.text) {
        out = `${context.nick}: ${out}`;
        context.noPrefix = true;
      }

      res(out);
    }
  }

  context.text = context.originalText;
};

Custom.prototype.addCustom = function (context) {
  //TODO: permissions check.
  var text = context.text.split(' ');
  var cmdName = text[0];
  text.shift();
  text = text.join(' ');

  var cmd = {
    name: cmdName,
    response: text,
    instanceId: context.instanceId,
    channel: context.to
  };

  this.commands.push(cmd);

  this.saveCmds();
};

Custom.prototype.rmCustom = function (context) {
  //TODO: permissions check.
  var text = context.text.split(' ');
  var cmdName = text[0];
  var changed = false;

  for (var i = 0; i < this.commands.length; i++) {
    if(this.commands[i].name.toLowerCase() === cmdName.toLowerCase()) {
      this.commands.splice(i, 1);
      changed = true;
    }
  }

  if(changed) {
    this.saveCmds();
  }
};

Custom.prototype.saveCmds = function () {
  jf.writeFileSync(path.join(__dirname, 'commands.json'), this.commands);
};

module.exports = Custom;
