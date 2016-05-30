function Context(options) {
  if(!options) {options = {};}
  var error = false; // We'll set this to true if we encounter any errors.

  var commandDelimiters = options.commandDelimiters || ['.'];

  // Required parameters.
  var to = validate(options.to, 'No channel specified! (options.to)');
  var nick = validate(options.nick, 'No nick specified! (options.nick)');
  var text = validate(options.text, 'No text specified! (options.text)');

  //TODO: More parameters.

  // Generated parameters.
  var isCmd = options.isCommand || false;

  // Parse isCmd once
  if (commandDelimiters && !isCmd) {
    for (var i = 0; i < commandDelimiters.length; i++) {
      if(text.startsWith(commandDelimiters[i])) {
        isCmd = true;
      }
    }
  }

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

  this.nick = function(){
    return nick;
  };

  this.to = function() {
    return to;
  };

  this.text = function() {
    return text;
  };

  this.isCommand = function() {
    for (var i = 0; i < commandDelimiters.length; i++) {
      if(text.startsWith(commandDelimiters[i])) {
        return true;
      }
    }
    return false;
  };

  this.toJSON = function() {
    return {
      nick: this.nick(),
      to: this.to(),
      text: this.text(),
      isCommand: this.isCommand(),
    };
  };

  this.clone = function() {
    return new Context(this.toJSON());
  };

  // this seems redundant, but I like it.
  this.isContext = function() {
    return this instanceof Context && !error;
  };

  this.answerToTheUltimateQuestionOfLifeTheUniverseAndEverything = function() {
    return 42;
  };
}

module.exports = Context;

function MissingValueError(msg) {
  if(!msg) {msg = 'A required value was missing!';}
  this.message = `MissingValueError: ${msg}`;
  this.code = 'MISSINGNO';
  Error.captureStackTrace(this, Context);
}
