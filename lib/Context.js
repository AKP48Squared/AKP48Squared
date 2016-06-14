
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
  this.name = 'MissingValueError';
  this.message = msg;
  this.code = 'E_MISSINGNO';
  Error.captureStackTrace(this, Context);
}

function CustomDataError(msg) {
  if(!msg) {msg = 'That key already exists!';}
  else {msg = `The key "${msg}" already exists!`;}
  this.name = 'CustomDataError';
  this.message = msg;
  this.code = 'E_EXISTS';
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

function getCommand(delimiters, text) {
  for (var i = 0; i < delimiters.length; i++) {
    if(text.startsWith(delimiters[i])) {
      //slice off the delimiter, split on space to separate into words.
      var arr = text.slice(delimiters[i].length).split(' ');
      var command = arr.shift().trim();
      var args = arr.join(' ').trim();
      return {
        delimiter: delimiters[i],
        command: command,
        args: args
      };
    }
  }
  return {
    delimiter: null,
    command: null,
    args: null
  };
}

function parseArgs(text) {
  var raw = require('string-argv')(text);
  var prepared = require('minimist')(raw);

  return {raw: raw, prepared: prepared};
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

  var isAlert = options.isAlert || false;
  var customData = {};
  var myNick = options.myNick || 'AKP48';
  var permissions = options.permissions || [];
  var rawMessage = options.message || options.text;

  // Generated parameters.
  var isCmd = options.isCommand || isCommand(commandDelimiters, text) || false;
  var tempCommand = getCommand(commandDelimiters, text);
  var command = tempCommand.command;
  var tempArgs = parseArgs(tempCommand.args);
  var args = tempArgs.prepared;
  var rawArgs = tempArgs.raw;
  var argText = tempCommand.args;

  this.args = function() {
    return args;
  };

  this.argText = function() {
    return argText;
  };

  this.clone = function() {
    return new Context(this.toObject());
  };

  this.cloneWith = function(opts) {
    var obj = this.toObject();
    var keys = Object.keys(opts);
    // don't be tempted to change this to a for...in. That doesn't work, apparently.
    for (var i = 0; i < keys.length; i++) {
      var prop = keys[i];
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

  this.commandDelimiterUsed = function() {
    return tempCommand.delimiter;
  };

  this.getCustomData = function(k) {
    if(!k) {
      throw new MissingValueError('Context.getCustomData requires a key!');
    }
    if(!customData[k]) { return null; }
    return customData[k];
  };

  this.getCustomKeys = function() {
    return Object.keys(customData);
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

  this.isAlert = function() {
    return isAlert;
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

  this.setCustomData = function(k, v) {
    if(customData[k]) {
      throw new CustomDataError(k);
    } else {
      customData[k] = v;
    }
    return this;
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
      isAlert: this.isAlert(),
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
    // if the message we got is actually a context itself,
    // we'll just pull the text from it and reply using it.
    if(msg instanceof Context) {
      msg.reply(msg.text());
      return;
    }
    // if the message doesn't exist, we'll use the text that this context contains.
    if(!msg) {
      msg = this.text();
    }
    instance._AKP48.sendMessage(msg, this);
  };

  this.answerToTheUltimateQuestionOfLifeTheUniverseAndEverything = function() {
    return 42;
  };
}

module.exports = Context;
