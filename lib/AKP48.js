const util = require('util');
const EventEmitter = require('events');
const glob = require('glob');
const path = require('path');
const Promise = require("bluebird"); // jshint ignore:line
const uuid = require('node-uuid');
const jsonfile = require('jsonfile');
jsonfile.spaces = 4;

function AKP48(config) {
  EventEmitter.call(this);

  this._startTime = Date.now();

  this.package = require('../package.json');

  this.config = config;

  this.plugins = {
    ServerConnector: {},
    MessageHandler: {},
    BackgroundTask: {}
  };

  this.svrInstances = {};

  var self = this;

  //loads all available plugins.
  this.loadPlugins().then(function() {
    //start the bot.
    self.start();
  });
}

util.inherits(AKP48, EventEmitter);

AKP48.prototype.onMessage = function (text, context) {
  if(!context || !text) {return;} //if we don't have a context or we don't have text, don't continue.
  if(context.isCmd) {
    GLOBAL.logger.silly(`AKP48: Emitting cmd.`);
    this.emit('cmd', text, context);
  }
  GLOBAL.logger.silly(`AKP48: Emitting msg.`);
  this.emit('msg', text, context);
};

AKP48.prototype.sendMessage = function (pluginInstance, to, message, context) {
  if(!message) {return;}
  GLOBAL.logger.silly(`AKP48: Sending message to ${pluginInstance}.`);
  if(context.isEmote) {
    this.emit('emote_'+pluginInstance, to, message, context);
  } else {
    this.emit('msg_'+pluginInstance, to, message, context);
  }
};

AKP48.prototype.sentMessage = function (to, message, context) {
  GLOBAL.logger.silly(`AKP48: Message sent to ${to}.`);
  this.emit('sendMsg', to, message, context);
};

AKP48.prototype.start = function () {
  GLOBAL.logger.debug(`AKP48: Starting bot.`);
  if(this.config === null) {
    this.createDefaultConfig();
  }

  //for each server in the config, load
  for (var i = 0; i < this.config.servers.length; i++) {
    var svr = this.config.servers[i];
    if(!svr._id) {
      this.config.servers[i]._id = uuid.v4();
      this.saveConfig(this.config);
    }

    GLOBAL.logger.debug(`AKP48: Loading server ${svr._id}.`);

    if(!this.plugins.ServerConnector[svr.plugin]) {
      GLOBAL.logger.error('AKP48: Invalid plugin "%s" specified in config! Server %s.', svr.plugin, svr._id);
    } else if (svr.disabled) {
      GLOBAL.logger.silly('AKP48: Server %s is marked as disabled. Not loading module.', svr._id);
    } else {
      GLOBAL.logger.silly(`AKP48: Loading ${svr.plugin} module.`);
      var Plugin = this.plugins.ServerConnector[svr.plugin].module;
      var pluginInstance = new Plugin(svr.config, svr._id, this);
      this.svrInstances[svr._id] = pluginInstance;
    }
  }

  for (var instance in this.svrInstances) {
    if (this.svrInstances.hasOwnProperty(instance)) {
      GLOBAL.logger.silly(`AKP48: Connecting instance ${instance}.`);
      this.svrInstances[instance].connect();
    }
  }
};

AKP48.prototype.loadPlugins = function () {
  var self = this;
  GLOBAL.logger.debug(`AKP48: Loading plugins.`);
  return new Promise(function(resolve, reject) {
    glob('plugins/**/plugin.json', function(err, files) {
      if(err) {reject(err); return;}
      for (var i = 0; i < files.length; i++) {
        var dir = path.dirname(files[i]);
        var info = require(path.resolve(files[i]));
        GLOBAL.logger.silly(`AKP48: Loading ${info.name}.`);
        var plugin = {
          name: info.name,
          info: info,
          module: require(path.resolve(dir, info.main))
        };

        if(info.type !== 'ServerConnector') {
          GLOBAL.logger.silly(`AKP48: Creating instance of ${info.name}.`);
          plugin.loaded = new plugin.module(self);
        }

        self.plugins[info.type][info.name] = plugin;
      }
      GLOBAL.logger.silly(`AKP48: Finished loading plugins.`);
      resolve(true);
    });
  });
};

AKP48.prototype.createDefaultConfig = function () {
  GLOBAL.logger.silly(`AKP48: Creating default config file.`);
  var conf = {
    servers: [
      {
        '_id': uuid.v4(),
        'plugin': 'irc',
        'config': {
          'server': 'irc.esper.net',
          'nick': 'AKP48',
          'channels': ['#AKP'],
          'chanConfig': {
            '#AKP': {
              'commandDelimiters': ['.', '!', 'AKP48:']
            }
          }
        }
      }
    ]
  };

  this.saveConfig(conf);
  this.config = conf;
};

AKP48.prototype.saveConfig = function (conf, serverID) {
  GLOBAL.logger.silly(`AKP48: Saving config file.`);
  var config = this.config;
  if(serverID) {
    for (var i = 0; i < config.servers.length; i++) {
      if(config.servers[i]._id === serverID) {
        config.servers[i].config = conf;
      }
    }
  } else {
    config = conf;
  }
  jsonfile.writeFileSync('./config.json', config, {spaces: 2});
};

module.exports = AKP48;
