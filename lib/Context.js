
/**
 * Verifies that a value exists before setting it. Throws an error if the
 * value doesn't exist.
 * @param  {Object} value      The value to check.
 * @param  {String} msg        The error message to use. (Optional)
 * @throws {MissingValueError}
 * @return {Object}            The value input, if it exists.
 */
function validate(value, msg) {
  if(!value) {
    throw new MissingValueError(msg);
  }

  return value;
}

function MissingValueError(msg) {
  if(!msg) {msg = 'A required value was missing!';}
  this.message = `MissingValueError: ${msg}`;
  this.code = 'MISSINGNO';
  Error.captureStackTrace(this, Context);
}

function isCommand(delimiters, text) {
  for (var i = 0; i < delimiters.length; i++) {
    if(text.startsWith(delimiters[i])) {
      return true;
    }
  }
  return false;
}

function parseArgs(text) {
  var raw = require('string-argv')(text);
  var command = raw.shift();
  var prepared = require('minimist')(raw);

  return {raw: raw, prepared: prepared, command: command};
}

function Context(options) {
  if(!options) {options = {};}

  // Required parameters.
  var instance = validate(options.instance, 'No instance specified! (options.instance)');
  var instanceType = validate(options.instanceType, 'No instance type specified! (options.instanceType)');
  var nick = validate(options.nick, 'No nick specified! (options.nick)');
  var text = validate(options.text, 'No text specified! (options.text)');
  var to = validate(options.to, 'No channel specified! (options.to)');
  var user = validate(options.user, 'No user specified! (options.user)');

  // Not so required parameters.
  var commandDelimiters = options.commandDelimiters || ['.'];
  // In case we're provided with a String.
  if(!Array.isArray(commandDelimiters)) {
    commandDelimiters = [commandDelimiters];
  }

  var myNick = options.myNick || 'AKP48';
  var permissions = options.permissions || {};
  var rawMessage = options.message || options.text;

  // Generated parameters.
  var isCmd = options.isCommand || isCommand(commandDelimiters, text) || false;
  var tempArgs = parseArgs(text);
  var args = tempArgs.prepared;
  var rawArgs = tempArgs.raw;
  var command = tempArgs.command;

  this.args = function() {
    return args;
  };

  this.clone = function() {
    return new Context(this.toObject());
  };

  this.cloneWith = function(opts) {
    var obj = this.toObject();
    for (var prop in Object.keys(opts)) { // jshint ignore:line
      obj[prop] = opts[prop];
    }
    return new Context(obj);
  };

  this.command = function() {
    return command;
  };

  this.commandDelimiters = function() {
    return commandDelimiters;
  };

  this.instance = function() {
    return instance;
  };

  this.instanceId = function() {
    return instance._id;
  };

  this.instanceName = function() {
    return instance._name || '';
  };

  this.instanceType = function() {
    return instanceType;
  };

  this.isCommand = function() {
    return isCmd;
  };

  // this seems redundant, but I like it.
  this.isContext = function() {
    return this instanceof Context;
  };

  this.myNick = function() {
    return myNick;
  };

  this.nick = function() {
    return nick;
  };

  this.permissions = function() {
    return permissions;
  };

  this.rawArgs = function() {
    return rawArgs;
  };

  this.rawMessage = function() {
    return rawMessage;
  };

  this.text = function() {
    return text;
  };

  this.to = function() {
    return to;
  };

  this.toObject = function() {
    return {
      commandDelimiters: this.commandDelimiters(),
      instance: this.instance(),
      instanceType: this.instanceType(),
      isCommand: this.isCommand(),
      myNick: this.myNick(),
      nick: this.nick(),
      permissions: this.permissions(),
      rawMessage: this.rawMessage(),
      text: this.text(),
      to: this.to(),
      user: this.user()
    };
  };

  this.user = function() {
    return user;
  };

  this.reply = function(msg) {
    instance._AKP48.sendMessage(msg, this);
  };

  this.answerToTheUltimateQuestionOfLifeTheUniverseAndEverything = function() {
    return 42;
  };
}

module.exports = Context;
