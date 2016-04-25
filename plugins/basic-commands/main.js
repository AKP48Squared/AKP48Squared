'use strict';
const MessageHandlerPlugin = require('../../lib/MessageHandlerPlugin');

class BasicCommands extends MessageHandlerPlugin {
  constructor(AKP48) {
    super('BasicCommands', AKP48);
    this._data = require('./plugin.json');
    var self = this;
    this.commands = {};
    require('./commands').then(function(res){
      self.commands = res;
    }, function(err){
      console.error(err);
    });
  }
}

BasicCommands.prototype.handleCommand = function (message, context, resolve) {
  GLOBAL.logger.silly(`${this._pluginName}: Received command.`);

  // prepare text.
  context.originalText = context.text;
  var text = context.text.split(' ');
  var command = text[0];
  text.shift();

  context.text = text.join(' ');
  context.command = command;

  //for each command we have
  for (var cmd in this.commands) {
    if (this.commands.hasOwnProperty(cmd)) {

      //check to see if it's the command we're wanting
      GLOBAL.logger.silly(`${this._pluginName}: Checking ${cmd} command for ${command}.`);

      //if this command is the one we're trying to run
      if(this.commands[cmd].names.includes(command.toLowerCase())) {
        GLOBAL.logger.silly(`${this._pluginName}: Found command for ${command}.`);

        //set name to first alias of command, for permissions check purposes.
        var name = this.commands[cmd].names[0];

        //check permissions. if command requires permissions
        if(this._data && this._data.commands && this._data.commands[name] &&
          this._data.commands[name].perms && this._data.commands[name].perms.length) {
          //and we don't have any at all, simply log and do nothing else
          if(!context.permissions) {
            GLOBAL.logger.silly(`${this._pluginName}: Command ${command} requires permissions and none were found.`);
          } else {
            //but if we have some permissions, loop through command perms and see if we have any of them.
            var canRun = false;
            for (var i = 0; i < this._data.commands[name].perms.length; i++) {
              if(context.permissions.includes(this._data.commands[name].perms[i])) {
                canRun = true;
                break;
              }
            }

            //canRun will be true if we have any of the required permissions, so we run
            if(canRun) {
              resolve(this.commands[cmd].respond(context));
            } else {
              //otherwise we can log and leave.
              GLOBAL.logger.silly(`${this._pluginName}: Command ${command} requires permissions and none were found.`);
            }
          }
        } else {
          //if we get here, the command doesn't require permissions, so we just run it.
          resolve(this.commands[cmd].respond(context));
        }
      }
    }
  }

  context.text = context.originalText;
};

module.exports = BasicCommands;
