function Reconnect() {
  this.names = ['reconnect', 'rc'];
}

Reconnect.prototype.respond = function (context) {
  context.instance.disconnect(context.text || 'brb <3');
  setTimeout(function(){
    context.instance.connect();
  }, 1000);
  return;
};

module.exports = Reconnect;
