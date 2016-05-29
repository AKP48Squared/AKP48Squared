module.exports = function(options) {
  var Context = this;
  var nick = options.nick;
  var to = options.to;
  var text = options.text;
  //TODO: Fill this out with everything we need.

  return function() {
    this.prototype = {
      nick: function(){
        return nick;
      },
      to: function() {
        return to;
      },
      text: function() {
        return text;
      },
      toJSON: function() {
        return {
          nick: this.nick(),
          to: this.to(),
          text: this.text()
        };
      },
      clone: function() {
        return new Context(this.toJSON());
      }
    };
  };
};
