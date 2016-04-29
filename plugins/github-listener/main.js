'use strict';
const BackgroundTaskPlugin = require('../../lib/BackgroundTaskPlugin');
const c = require('irc-colors');
const getRepoInfo = require('git-repo-info');
const GitHubHook = require('githubhook');
const glob = require('glob');
const path = require('path');
const Promise = require('bluebird'); //jshint ignore:line
const shell = require('shelljs');

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
        repository: 'AKP48Squared',
        branch: 'master',
        autoUpdate: false,
        enabled: true
      };

      this._AKP48.saveConfig(this._config, 'github-listener');
    }

    this._isRepo = (getRepoInfo._findRepo('.') !== null);

    if(this._config.enabled) {
      this._listener = new GitHubHook({
        path: this._config.path,
        port: this._config.port,
        secret: this._config.secret,
        logger: { //define a logger object, so the module doesn't just use console directly.
          log: function(msg){
            GLOBAL.logger.silly(`${self._pluginName}|GitHubHook: `+msg);
          },
          error: function(msg){
            GLOBAL.logger.error(`${self._pluginName}|GitHubHook: `+msg);
          }
        }
      });

      GLOBAL.logger.info(`${this._pluginName}: Listening for Webhooks from GitHub.`);
      GLOBAL.logger.debug(`${this._pluginName}: Listening at ${this._config.path} on ${this._config.port}.`);
      GLOBAL.logger.silly(`${this._pluginName}: Listening for repo ${this._config.repository}, branch ${this._config.branch}.`);

      this._listener.listen();

      var self = this;
      this._listener.on(`push:${this._config.repository}`, function (ref, data) {
        if(data.deleted) {
          return;
        }
        GLOBAL.logger.silly(`${self._pluginName}: Received Webhook: ref => ${ref}.`);

        var branch = ref.substring(ref.indexOf('/', 5) + 1);

        //send out alert.
        var commits = `${data.commits.length} commit`.pluralize(data.commits.length);
        var url = data.compare;

        var msg = `${c.pink('[GitHub]')} ${commits} ${data.forced && !data.created ? 'force ' : ''}pushed to ${data.created ? 'new ' : ''}`;
        msg += `${data.ref.startsWith('refs/tags/') ? 'tag ' : 'branch '}${c.bold(branch)} by ${data.pusher.name} `;
        msg += `(${url})`;

        for (var i = 0; i < data.commits.length && i < 3; i++) {
            var _c = data.commits[data.commits.length - 1 - i];
            var _m = _c.message;
            var end = _m.indexOf('\n');
            var commit_msg = c.green(`[${_c.id.substring(0,7)}] `);
            commit_msg += `${_c.author.username}: ${_m.substring(0, end === -1 ? _m.length : end)}`;
            msg += `\n${commit_msg}`;
        }

        GLOBAL.logger.debug(`${self._pluginName}: Sending alert.`);

        self._AKP48.sendMessage(msg, {isAlert: true});

        if(self.shouldUpdate(branch)) {
          self.handle(branch, data);
        }
      });

      this._listener.on(`pull_request:${this._config.repository}`, function(ref, data) {
        if(data.action === 'closed' && data.pull_request.merged) {
          data.action = 'merged';
        }
        if(data.pull_request.title.length >= 80) {
          data.pull_request.title = data.pull_request.title.substring(0,80) + '...';
        }
        var out = `${c.pink('[GitHub]')} Pull Request ${data.number} ${data.action}. Title: ${data.pull_request.title}`;

        self._AKP48.sendMessage(out, {isAlert: true});
      });

      this._listener.on(`issues:${this._config.repository}`, function(ref, data) {
        if(data.issue.title.length >= 80) {
          data.issue.title = data.issue.title.substring(0,80) + '...';
        }
        if(data.action === 'assigned' || data.action === 'unassigned') {
          data.action += ` ${data.action === 'unassigned' ? 'from' : 'to'} ${data.assignee.login}`;
        }

        if(data.action === 'labeled' || data.action === 'unlabeled') {
          data.action += ` ${data.label.name}`;
        }
        var out = `${c.pink('[GitHub]')} Issue ${data.issue.number} ${data.action}. Title: ${data.issue.title}`;

        self._AKP48.sendMessage(out, {isAlert: true});
      });

      this._listener.on(`issue_comment:${this._config.repository}`, function(ref, data) {
        if(data.comment.body.length >= 80) {
          data.comment.body = data.comment.body.substring(0,80) + '...';
        }
        var out = `${c.pink('[GitHub]')} New comment on issue ${data.issue.number} by ${c.bold(data.comment.user.login)}. ${data.comment.body} (${data.comment.html_url})`;

        self._AKP48.sendMessage(out, {isAlert: true});
      });

      this._listener.on(`gollum:${this._config.repository}`, function(ref, data) {
        for (var i = 0; i < data.pages.length; i++) {
          var pg = data.pages[i];
          var out = `${c.pink('[GitHub]')} Wiki Page ${c.bold(pg.page_name)} ${pg.action}. (${pg.html_url})`;
          self._AKP48.sendMessage(out, {isAlert: true});
        }
      });

      this._listener.on(`fork:${this._config.repository}`, function(ref, data) {
        var out = `${c.pink('[GitHub]')} New Fork! ${c.bold(data.sender.login)} forked the repo! (${data.forkee.html_url})`;

        self._AKP48.sendMessage(out, {isAlert: true});
      });

      this._listener.on(`watch:${this._config.repository}`, function(ref, data) {
        var out = `${c.pink('[GitHub]')} New Star! ${c.bold(data.sender.login)} starred the repo!`;

        self._AKP48.sendMessage(out, {isAlert: true});
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

  var star = other.indexOf('*'), star2 = other.lastIndexOf('*');
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

  return this.compare(branch, updateBranch);
};

GitHubListener.prototype.handle = function (branch, data) {
  var self = this;
  GLOBAL.logger.info(`${this._pluginName}: Handling Webhook for branch ${branch}.`);

  if (!shell.which('git') || !this._isRepo) {
    GLOBAL.logger.debug(`${this._pluginName}: Not a git repo; stopping update.`);
    return;
  }

  var changing_branch = branch !== this.getBranch();
  var update = this._config.autoUpdate && (data.commits.length !== 0 || changing_branch);

  GLOBAL.logger.silly(`${this._pluginName}: Is changing branch? ${changing_branch}.`);
  GLOBAL.logger.silly(`${this._pluginName}: Is updating? ${update}.`);

  if (!update) {
    GLOBAL.logger.debug(`${this._pluginName}: Nothing to update; stopping update.`);
    return;
  }

  var shutdown = changing_branch;
  var npm = changing_branch;
  var hot_files = ['app.js'];

  if (!shutdown) {

    for (var commit in data.commits) {
      if (data.commits.hasOwnProperty(commit)) {
        var com = data.commits[commit];
        for (var file in com.modified) {
          if (com.modified.hasOwnProperty(file)) {
            if(hot_files.indexOf(com.modified[file]) !== -1) {
              shutdown = true;
            }
            if(com.modified[file].includes('package.json')) {
              npm = true;
            }
          }
        }

        for (var f in com.created) {
          if (com.modified.hasOwnProperty(f)) {
            if(com.modified[f].includes('package.json')) {
              npm = true;
            }
          }
        }
      }
    }
  }

  GLOBAL.logger.debug(`${this._pluginName}: Updating to branch "${branch}".`);

  // Fetch, Checkout
  if (!this.checkout(branch)) {
    return;
  }

  if(npm) {
    GLOBAL.logger.debug(`${this._pluginName}: Executing npm install.`);
    shell.cd(require('app-root-path').path);
    shell.exec('npm install');
  }

  var pluginPath = path.resolve(require('app-root-path').path, 'plugins/*/plugin.json');
  glob(pluginPath, function(err, files) {
    if(err) {GLOBAL.logger.error(`${this._pluginName}: Glob error: "${err}".`);return;}

    new Promise(function(resolve) {
      //two separate loops because shell is doing something weird if I do it all as one loop.
      //first loop resolves paths to full absolute paths.
      for (var i = 0; i < files.length; i++) {
        files[i] = path.dirname(path.resolve(files[i]));
      }

      var proms = [];

      //second loop CDs into each directory and runs npm install.
      for (var j = 0; j < files.length; j++) {
        shell.cd(files[j]);

        proms.push(new Promise(function(resolve){ // jshint ignore:line
          if(npm) {
            GLOBAL.logger.debug(`${self._pluginName}: Executing npm install for ${files[j]}.`);
            shell.exec('npm install', function(){
              resolve();
            });
          } else {
            resolve();
          }
        }));
      }

      Promise.all(proms).then(function(){
        resolve(); //resolve promise after all npm installs are finished.
      });

    }).then(function(){
      if (shutdown) {
        self._AKP48.shutdown(`I'm updating! :3`);
      } else {
        self._AKP48.reload();
      }
    });
  });
};

GitHubListener.prototype.fetch = function () {
  if(shell.exec('git fetch').code) {
    GLOBAL.logger.error(`${this._pluginName}: Attempted git fetch failed!`);
    return;
  } else {
    GLOBAL.logger.debug(`${this._pluginName}: Fetched latest code from git.`);
  }
  return true;
};

GitHubListener.prototype.getCommit = function () {
  return getRepoInfo().sha;
};

GitHubListener.prototype.getBranch = function () {
  return getRepoInfo().branch;
};

GitHubListener.prototype.getTag = function () {
  return getRepoInfo().tag;
};

GitHubListener.prototype.checkout = function (branch) {
  if (!branch || !this.fetch()) {
    return;
  }
  if (this.getBranch() !== branch) {
    if (shell.exec(`git checkout -q ${branch}`).code) {
      GLOBAL.logger.error(`${this._pluginName}: Attempted git reset failed!`);
      return;
    } else {
      GLOBAL.logger.debug(`${this._pluginName}: Successfully checked out branch "${branch}".`);
    }
  }
  if ((this.getBranch() || this.getTag()) && shell.exec(`git reset -q origin/${branch} --hard`).code) {
    GLOBAL.logger.error(`${this._pluginName}: Attempted git reset failed!`);
    return;
  } else {
    GLOBAL.logger.debug(`${this._pluginName}: Successfully reset to branch "${branch}".`);
  }
  return true;
};

//called when we are told we're unloading.
GitHubListener.prototype.unload = function () {
  var self = this;
  return new Promise(function (resolve) {
    if(self._listener) {
      self._listener.stop();
      delete self._listener;
    }
    resolve();
  });
};

module.exports = GitHubListener;
