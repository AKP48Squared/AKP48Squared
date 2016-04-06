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

  this.config = config;

  this.plugins = {
    ServerConnector: {},
    MessageHandler: {},
    BackgroundTask: {}
  };

  this.svrInstances = {

  };

  var self = this;

  //loads all available plugins.
  this.loadPlugins().then(function() {
    //start the bot.
    self.start();
  });
}

util.inherits(AKP48, EventEmitter);

AKP48.prototype.onMessage = function (text, context) {
  if(context.isCmd) {
    this.emit('cmd', text, context);
  }
  this.emit('msg', text, context);
};

AKP48.prototype.sendMessage = function (pluginInstance, to, message, context) {
  this.emit('msg_'+pluginInstance, to, message, context);
};

AKP48.prototype.sentMessage = function (to, message, context) {
  this.emit('sendMsg', to, message, context);
};

AKP48.prototype.start = function () {
  if(this.config === null) {
    this.createDefaultConfig();
  }

  //for each server in the config, load
  for (var i = 0; i < this.config.servers.length; i++) {
    var svr = this.config.servers[i];

    if(!this.plugins.ServerConnector[svr.plugin]) {
      throw new Error('Invalid plugin specified in config!');
    }

    var Plugin = this.plugins.ServerConnector[svr.plugin].module;

    var pluginInstance = new Plugin(svr.config, svr._id, this);

    this.svrInstances[svr._id] = pluginInstance;
  }

  for (var instance in this.svrInstances) {
    if (this.svrInstances.hasOwnProperty(instance)) {
      this.svrInstances[instance].connect();
    }
  }
};

AKP48.prototype.loadPlugins = function () {
  var self = this;
  return new Promise(function(resolve, reject) {
    glob('plugins/**/plugin.json', function(err, files) {
      if(err) {reject(err); return;}
      for (var i = 0; i < files.length; i++) {
        var dir = path.dirname(files[i]);
        var info = require(path.resolve(files[i]));
        var plugin = {
          name: info.name,
          info: info,
          module: require(path.resolve(dir, info.main))
        };

        if(info.type !== 'ServerConnector') {
          plugin.loaded = new plugin.module(self);
        }

        self.plugins[info.type][info.name] = plugin;
      }
      resolve(true);
    });
  });
};

AKP48.prototype.createDefaultConfig = function () {
  var conf = {
    servers: [
      {
        '_id': uuid.v4(),
        'plugin': 'irc',
        'config': {
          'server': 'irc.esper.net',
          'nick': 'AKP48-Dev-2',
          'channels': ['#AKP']
        }
      }
    ]
  };

  this.saveConfig(conf);
  this.config = conf;
};

AKP48.prototype.saveConfig = function (conf) {
  jsonfile.writeFileSync('./config.json', conf);
};

module.exports = AKP48;
