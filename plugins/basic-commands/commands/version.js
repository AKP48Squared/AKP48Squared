function Version() {
  this.names = ['version', 'v'];
}

Version.prototype.respond = function () {
  return 'v'+this.buildVersion();
};

Version.prototype.buildVersion = function () {
  var version = GLOBAL.AKP48.package.version;
  var GitPlugin = GLOBAL.AKP48.getPluginInstance('BackgroundTask', 'github-listener');
  var str = '';

  if(GitPlugin._isRepo) {
    var commit = GitPlugin.getCommit().substring(0,7);
    var branch = GitPlugin.getBranch() || GitPlugin.getTag();


    str = `+${commit}-${branch}`;
  }

  return version + str;
};

module.exports = Version;
