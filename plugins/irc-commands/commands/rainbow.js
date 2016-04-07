var c = require('irc-colors');

function Rainbow() {
  this.names = ['rainbow', 'r'];
}

Rainbow.prototype.respond = function (context) {
  context.noPrefix = true;
  if(context.text.length) {
    return c.rainbow(context.text);
  }

  return null;
};

module.exports = Rainbow;
