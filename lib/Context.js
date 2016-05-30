function Context(options) {
  var nick = options.nick;
  var to = options.to;
  var text = options.text;
  var commandDelimiters = options.commandDelimiters;
  var isCmd = options.isCommand || false;
  
  //TODO: Fill this out with everything we need.
  // Parse isCmd once
  if (commandDelimiters && !isCmd) {
    for (var i = 0; i < commandDelimiters.length; i++) {
      if(text.startsWith(commandDelimiters[i])) {
        isCmd = true;
      }
    }
  }
  
  return {
    nick: function(){
      return nick;
    },
    to: function() {
      return to;
    },
    text: function() {
      return text;
    },
    isCommand: function() {
      return isCmd;
    },
    toJSON: function() {
      return {
        nick: this.nick(),
        to: this.to(),
        text: this.text()
        isCommand: this.isCommand(),
      };
    },
    clone: function() {
      return new Context(this.toJSON());
    }
  };
}

module.exports = Context;
