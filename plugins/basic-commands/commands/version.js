function Version() {
  this.names = ['version', 'v'];
  this.version = this.buildVersion();
}

Version.prototype.respond = function () {
  return 'v'+this.version;
};

Version.prototype.buildVersion = function () {
  var version = GLOBAL.AKP48.package.version;

  //TODO: handle checking for git?

  return version;
};

module.exports = Version;
