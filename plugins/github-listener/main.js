'use strict';
const BackgroundTaskPlugin = require('../../lib/BackgroundTaskPlugin');
const GitHubHook = require('githubhook');

class GitHubListener extends BackgroundTaskPlugin {
  constructor(AKP48, config) {
    super('GitHubListener', AKP48);
    this._config = config;
    if(!this._config) {
      GLOBAL.logger.info(`${this._pluginName}: No config specified. Generating defaults.`);
      this._config = {
        port: 4269,
        path: '/github/callback',
        secret: '',
        repository: 'AKPWebDesign/AKP48Squared',
        branch: 'master',
        autoUpdate: true,
        enabled: true
      };

      this._AKP48.saveConfig(this._config, 'github-listener');
    }

    if(this._config.enabled) {
      this._listener = GitHubHook({
        path: this._config.path,
        port: this._config.port,
        secret: this._config.secret
      });

      GLOBAL.logger.info(`${this._pluginName}: Listening for Webhooks from GitHub.`);
      GLOBAL.logger.debug(`${this._pluginName}: Listening at ${this._config.path} on ${this._config.port}.`);
      GLOBAL.logger.silly(`${this._pluginName}: Listening for repo ${this._config.repository} and branch ${this._config.branch}.`);

      this._listener.listen();

      var self = this;
      this._listener.on(`push:${this._config.repository}`, function (ref, data) {
        if(data.deleted) {
          return;
        }
        GLOBAL.logger.silly(`${this._pluginName}: Received Webhook: ref => ${ref}.`);

        var branch = ref.substring(ref.indexOf('/', 5) + 1);

        if(self.shouldUpdate(branch)) {
          self.handle(branch, data);
        }
      });
    }
  }
}

GitHubListener.prototype.compare = function (original, other) {
  if (other === '*' || original === other) { // Checking here saves pain and effort
      return true;
  } else if (other.startsWith('!') || other.startsWith('-')) { // We should update to all except the specified
      // Should we do a compare?
      //return !compare(original, other.substring(1));
      return original !== other.substring(1);
  }

  var star = other.indexOf('*'), star2 = other.lastIndexOf('*'), string;
  if (star !== -1) {
      if (star2 > star) {
          return original.contains(other.substring(star + 1, star2 - 1));
      }
      if (star === 0) {
          return original.endsWith(other.substring(star + 1));
      } else {
          return original.startsWith(other.substring(star - 1));
      }
  }

  return false;
};

GitHubListener.prototype.shouldUpdate = function (branch) {
  var updateBranch = this._config.branch;
  if (Array.isArray(updateBranch)) { // We update only if it is listed
      for (var x = 0; x < updateBranch.length; x++) {
          var _branch = updateBranch[x];
          if (this.compare(branch, _branch)) {
              return true;
          }
      }
      return false;
  }

  return compare(branch, updateBranch);
};

GitHubListener.prototype.handle = function (branch, data) {
  //TODO.
};

//called when we are told we're unloading.
GitHubListener.prototype.unload = function () {
  //TODO.
};

module.exports = GitHubListener;
