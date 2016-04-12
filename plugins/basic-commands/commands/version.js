function Version() {
  this.names = ['version', 'v'];
  this.version = this.buildVersion();
  this.GitPlugin = GLOBAL.AKP48.getPluginInstance('BackgroundTask', 'github-listener');
}

Version.prototype.respond = function () {
  return 'v'+this.version;
};

Version.prototype.buildVersion = function () {
  var version = GLOBAL.AKP48.package.version;

  if(this.GitPlugin._isRepo) {
    var tag = this.GitPlugin.getTag();
    var commit = this.GitPlugin.getCommit() || tag;
    var branch = this.GitPlugin.getBranch();

    var str = ` ${branch}@${commit}`;
  }

  return version + str;
};

module.exports = Version;
