function Reload() {
  this.names = ['reload', 'rl'];
}

Reload.prototype.respond = function (context) {
  if(context.perms && context.perms['basic-commands'].reload) {
    GLOBAL.AKP48.reload();
  }
  return '';
};

module.exports = Reload;
