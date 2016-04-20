function Daft() {
  this.names = ['daft'];
}

Daft.prototype.respond = function (context) {
  var noun = '';
  if(context.text.length) {
    noun = `${context.text.trim()}: `;
    context.noPrefix = true;
  }

  return `${noun}are you daft?`;
};

module.exports = Daft;
