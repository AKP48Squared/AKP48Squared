function Reload() {
  this.names = ['reload', 'rl'];
}

Reload.prototype.respond = function () {
  GLOBAL.AKP48.reload();
  return 'Reloading...';
};

module.exports = Reload;
