function Shutdown() {
  this.names = ['shutdown', 'restart'];
}

Shutdown.prototype.respond = function (context) {
  GLOBAL.AKP48.shutdown(context.text);
  return '';
};

module.exports = Shutdown;
