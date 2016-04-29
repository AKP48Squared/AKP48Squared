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
      this.commands = [];
      if(e instanceof SyntaxError) {
        GLOBAL.logger.error(`${this._pluginName}: Error loading commands. Check your JSON for errors. Disabling saving so you don't lose any data.`);
        this.disableSaving = true;
      } else if (e.code === 'MODULE_NOT_FOUND') {
        this.saveCmds();
      }
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

  var done = false;

  context.text = text.join(' ');

  if(command.toLowerCase() === 'addcustom') {
    res(this.addCustom(context));
    done = true;
  }

  if(command.toLowerCase() === 'rmcustom') {
    res(this.rmCustom(context));
    done = true;
  }

  for (var i = 0; i < this.commands.length; i++) {
    var cmd = this.commands[i];
    if(cmd.name.toLowerCase() === command.toLowerCase() &&
       cmd.instanceId === context.instanceId && cmd.channel === context.to) {

      GLOBAL.logger.silly(`${this._pluginName}: Handling ${cmd.name}`);
      var out = this.commands[i].response;

      if(context.text) {
        out = `${context.text}: ${out}`;
        context.noPrefix = true;
      }

      res(out);
      done = true;
    }
  }

  if(!done) {
    res(null);
  }

  context.text = context.originalText;
};

Custom.prototype.addCustom = function (context) {
  GLOBAL.logger.silly(`${this._pluginName}: Handling addCustom.`);
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

  return `Added command "${cmdName}"`;
};

Custom.prototype.rmCustom = function (context) {
  GLOBAL.logger.silly(`${this._pluginName}: Handling rmCustom.`);
  //TODO: permissions check.
  var text = context.text.split(' ');
  var cmdName = text[0];
  var changed = false;

  for (var i = 0; i < this.commands.length; i++) {
    var cmd = this.commands[i];
    if(cmd.name.toLowerCase() === cmdName.toLowerCase() &&
       cmd.instanceId === context.instanceId && cmd.channel === context.to) {
      this.commands.splice(i, 1);
      changed = true;
    }
  }

  if(changed) {
    this.saveCmds();
    return `Removed command "${cmdName}"`;
  } else {
    return `No commands by that name were found!`;
  }
};

Custom.prototype.saveCmds = function () {
  if(this.disableSaving) {
    GLOBAL.logger.silly(`${this._pluginName}: Saving disabled.`);
    return;
  }

  GLOBAL.logger.silly(`${this._pluginName}: Saving commands.json.`);
  jf.writeFileSync(path.join(__dirname, 'commands.json'), this.commands);
};

module.exports = Custom;
