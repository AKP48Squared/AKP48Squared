function Version() {
  this.names = ['version', 'v'];
  this.version = this.buildVersion();
}

Version.prototype.respond = function () {
  return 'v'+this.version;
};

Version.prototype.buildVersion = function () {
  var version = GLOBAL.AKP48.package.version;
  var GitPlugin = GLOBAL.AKP48.getPluginInstance('BackgroundTask', 'github-listener');
  var str = '';

  if(GitPlugin._isRepo) {
    var tag = GitPlugin.getTag();
    var commit = GitPlugin.getCommit() || tag;
    var branch = GitPlugin.getBranch();

    str = ` ${branch}@${commit}`;
  }

  return version + str;
};

module.exports = Version;
