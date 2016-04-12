function Shutdown() {
  this.names = ['shutdown', 'restart'];
}

Shutdown.prototype.respond = function (context) {
  if(context.perms && context.perms.contains('basic-commands.shutdown') || true) {
    GLOBAL.AKP48.shutdown(context.text);
  }
  return '';
};

module.exports = Shutdown;
