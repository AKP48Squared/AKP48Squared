function Ping() {
  this.names = ['ping', 'p'];
}

Ping.prototype.respond = function (context) {
  var str = '';
  if(context.text.length) {
    str = Date.now();
  }
  return `Pong. ${str}`;
};

module.exports = Ping;
