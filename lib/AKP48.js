const util = require('util');
const EventEmitter = require('events');
const glob = require('glob');
const path = require('path');
const Promise = require("bluebird"); // jshint ignore:line
const uuid = require('node-uuid');
const jsonfile = require('jsonfile');
jsonfile.spaces = 4;

function AKP48(config, reloadFunction, persistentObjects, startTime) {
  EventEmitter.call(this);

  this._startTime = startTime || Date.now();

  this.reloadFunction = reloadFunction;

  this.package = require('../package.json');

  this.config = config;

  this.plugins = {
    ServerConnector: {},
    MessageHandler: {},
    BackgroundTask: {}
  };

  this.svrInstances = {};

  var self = this;

  if(this.config === null) {
    this.createDefaultConfig();
  }

  //loads all available plugins.
  this.loadPlugins().then(function() {
    //start the bot.
    self.start(persistentObjects);
  });
}

util.inherits(AKP48, EventEmitter);

AKP48.prototype.onMessage = function (text, contexts) {
  if(!contexts || !text) {return;} //if we don't have a context or we don't have text, don't continue.
  var self = this;
  var anyCmds = false;
  var lastResp = '';

  this.emit('fullMsg', text, contexts[0]);

  Promise.reduce(contexts, function(resp, ctx) {
    return new Promise(function(res) {
      if(!resp) {resp = lastResp;} // this is to allow for responders that don't actually send a response.
      if(ctx.isCmd) {
        if(resp.length) {
          ctx.text += ` ${resp}`;
        }
        self.emit('cmd', ctx.text, ctx, res);
        anyCmds = true;
      } else {
        lastResp = resp;
        self.emit('msg', ctx.text, ctx, res);
      }
    }).then(function(response) {
      if(!ctx.last && resp.length) {
        return `${resp} ${response}`;
      } else {
        return response;
      }
    });
  }, lastResp).then(function(resp) {
    // if we have anything we should respond to...
    if(anyCmds) {
      // send message using the last context, in case the command was a proxy command
      // and we need to send to a different channel or anything.
      self.sendMessage(resp, contexts[contexts.length-1]);
    }
  });
};

AKP48.prototype.sendMessage = function (message, context) {
  if(!message || !context) {return;}

  var pluginInstance = context.instanceId;
  var to = context.to;
  message = message.trim();

  if(context.isEmote) {
    GLOBAL.logger.silly(`AKP48: Sending emote to ${pluginInstance}.`);
    this.emit('emote_'+pluginInstance, to, message, context);
  } else if (context.isAlert)  {
    GLOBAL.logger.silly(`AKP48: Sending alert to all instances.`);
    this.emit('alert', message);
  } else {
    GLOBAL.logger.silly(`AKP48: Sending message to ${pluginInstance}.`);
    this.emit('msg_'+pluginInstance, to, message, context);
  }
};

AKP48.prototype.sentMessage = function (to, message, context) {
  if(context.isEmote) {
    GLOBAL.logger.silly(`AKP48: Emote sent to ${to}.`);
  } else if (context.isAlert) {
    GLOBAL.logger.silly(`AKP48: Alert sent to ${to}.`);
  } else {
    GLOBAL.logger.silly(`AKP48: Message sent to ${to}.`);
  }

  this.emit('sendMsg', to, message, context);
};

AKP48.prototype.start = function (persistentObjects) {
  if(!persistentObjects) {
    GLOBAL.logger.info(`AKP48: Starting bot.`);
  } else {
    GLOBAL.logger.info(`AKP48: Reloading bot.`);
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
      var pluginInstance;
      try {
        if(persistentObjects) {
          pluginInstance = new Plugin(svr.config, svr._id, this, persistentObjects[svr._id]);
        } else {
          pluginInstance = new Plugin(svr.config, svr._id, this);
        }
        this.svrInstances[svr._id] = pluginInstance;
      } catch(e) {
        GLOBAL.logger.error(`AKP48: Error encountered loading ${svr._id}! ServerConnector not loaded. Error: ${e.message}`);
      }
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
    var pluginPath = path.resolve(require('app-root-path').path, 'plugins/**/plugin.json');
    glob(pluginPath, function(err, files) {
      if(err) {reject(err); return;}
      for (var i = 0; i < files.length; i++) {
        var dir = path.dirname(files[i]);
        var info = require(path.resolve(files[i]));
        GLOBAL.logger.silly(`AKP48: Loading ${info.name}.`);
        var plugin = {
          name: info.name,
          info: info,
          module: require(path.resolve(dir, info.main)),
          config: null
        };

        if(self.config.plugins && self.config.plugins[info.name]) {
          plugin.config = self.config.plugins[info.name];
        }

        try {
          if(info.type !== 'ServerConnector') {
            GLOBAL.logger.silly(`AKP48: Creating instance of ${info.name}.`);
            plugin.loaded = new plugin.module(self, plugin.config);
          }

          self.plugins[info.type][info.name] = plugin;
        } catch(e) {
          GLOBAL.logger.error(`AKP48: Error encountered loading ${info.name}! Plugin not loaded. Error: ${e.message}`);
        }
      }
      GLOBAL.logger.silly(`AKP48: Finished loading plugins.`);
      resolve(true);
    });
  });
};

AKP48.prototype.getPluginInstance = function (type, plugin) {
  if(!this.plugins[type]) {return null;}
  return this.plugins[type][plugin].loaded || null;
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
    ],
    logger: {
      level: 'info'
    }
  };

  this.saveConfig(conf);
};

AKP48.prototype.saveConfig = function (conf, pluginName, isServerInstance) {
  GLOBAL.logger.silly(`AKP48: Saving config file.`);
  var config = this.config;
  if(isServerInstance) {
    if(pluginName) {
      for (var i = 0; i < config.servers.length; i++) {
        if(config.servers[i]._id === pluginName) {
          config.servers[i].config = conf;
        }
      }
    } else {
      GLOBAL.logger.error(`AKP48: Invalid config settings. Aborting config save.`);
      return;
    }
  } else {
    if(pluginName) {
      if(!config.plugins) {config.plugins = {};}
      config.plugins[pluginName] = conf;
    } else {
      config = conf;
    }
  }

  jsonfile.writeFileSync('./config.json', config, {spaces: 2});
  this.config = config;
};

AKP48.prototype.shutdown = function (msg) {
  this.emit('alert', `Shutting down...`);

  for (var svr in this.svrInstances) {
    if (this.svrInstances.hasOwnProperty(svr)) {
      GLOBAL.logger.silly(`AKP48: Sending disconnect to ${svr}.`);
      this.svrInstances[svr].disconnect(msg);
    }
  }

  for (var plugin in this.plugins.BackgroundTask) {
    if (this.plugins.BackgroundTask.hasOwnProperty(plugin)) {
      GLOBAL.logger.silly(`AKP48: Unloading ${plugin}.`);
      this.plugins.BackgroundTask[plugin].loaded.unload();
    }
  }

  GLOBAL.logger.silly(`AKP48: Shutting down.`);
  setTimeout(function(){
    process.exit(0);
  }, 1500);
};

AKP48.prototype.reload = function () {
  var self = this;
  this.emit('alert', `Reloading...`);
  GLOBAL.logger.debug(`AKP48: Unloading plugins and storing server connection data.`);
  var persistentObjects = {};
  //save persistentObjects for all servers.
  for (var svr in this.svrInstances) {
    if (this.svrInstances.hasOwnProperty(svr)) {
      GLOBAL.logger.silly(`AKP48: Storing data from ${svr}.`);
      persistentObjects[svr] = this.svrInstances[svr].getPersistentObjects();
      GLOBAL.logger.silly(`AKP48: Deleting ${svr}.`);
      if(!persistentObjects[svr]) {
        this.svrInstances[svr].disconnect();
      }
      delete this.svrInstances[svr];
    }
  }

  var proms = [];

  //jshint ignore:start
  for (var plugin in this.plugins.MessageHandler) {
    if (this.plugins.MessageHandler.hasOwnProperty(plugin)) {
      GLOBAL.logger.silly(`AKP48: Unloading ${plugin}.`);
      proms.push(this.plugins.MessageHandler[plugin].loaded.unload());
    }
  }

  for (var plugin in this.plugins.BackgroundTask) {
    if (this.plugins.BackgroundTask.hasOwnProperty(plugin)) {
      GLOBAL.logger.silly(`AKP48: Unloading ${plugin}.`);
      proms.push(this.plugins.BackgroundTask[plugin].loaded.unload());
    }
  }
  //jshint ignore:end

  GLOBAL.logger.debug(`AKP48: Clearing require cache.`);
  for (var prop in require.cache) {
    if (require.cache.hasOwnProperty(prop)) {
      delete require.cache[prop];
    }
  }

  //stop plugins from listening to us.
  this.removeAllListeners();

  //reset variables.
  this.plugins = {
    ServerConnector: {},
    MessageHandler: {},
    BackgroundTask: {}
  };

  this.svrInstances = {};

  //reload config
  this.config = require('../config.json');

  //ensure that all our unload promises have finished.
  Promise.all(proms).then(function() {
    //time to reload
    GLOBAL.logger.debug('AKP48: Reloading.');
    self.reloadFunction(persistentObjects, this._startTime);
  });
};

module.exports = AKP48;
