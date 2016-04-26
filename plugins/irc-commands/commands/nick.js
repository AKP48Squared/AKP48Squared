function Nick() {
  this.names = ['nick'];
}

Nick.prototype.respond = function (context) {
  if(context.text) {
    context.instance._client.send('NICK', context.text);
  }

  return null;
};

module.exports = Nick;
