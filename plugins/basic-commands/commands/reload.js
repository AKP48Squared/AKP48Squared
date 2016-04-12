function Reload() {
  this.names = ['reload', 'rl'];
}

Reload.prototype.respond = function (context) {
  if(context.perms && context.perms.contains('basic-commands.reload') || true) {
    GLOBAL.AKP48.reload();
  }
  return '';
};

module.exports = Reload;
