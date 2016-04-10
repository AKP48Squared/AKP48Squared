function Me() {
  this.names = ['me', 'emote'];
}

Me.prototype.respond = function (context) {
  context.isEmote = true;
  return context.text || null;
};

module.exports = Me;
