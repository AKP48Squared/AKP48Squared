function Daft() {
  this.names = ['daft'];
}

Daft.prototype.respond = function (context) {
  var noun = context.nick;
  if(context.text.length) {
    noun = context.text;
  }
  return `${noun}, are you daft?`;
};

module.exports = Daft;
