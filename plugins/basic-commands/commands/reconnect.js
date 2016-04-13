function Reconnect() {
  this.names = ['reconnect', 'rc'];
}

Reconnect.prototype.respond = function (context) {
  context.instance.disconnect(context.text || 'brb <3');
  context.instance.connect();
  return;
};

module.exports = Reconnect;
