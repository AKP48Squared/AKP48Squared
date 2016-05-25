const util = require('util');
const EventEmitter = require('events');
const glob = require('glob');
const path = require('path');
const Promise = require("bluebird"); // jshint ignore:line
const uuid = require('node-uuid');
const jsonfile = require('jsonfile');
jsonfile.spaces = 4;

function AKP48(config, configOpts, reloadFunction, startTime) {
  EventEmitter.call(this);

  this.setMaxListeners(250); // I wonder how many plugins we can actually support before performance starts to drop...

  this._startTime = startTime || Date.now();

  this.reloadFunction = reloadFunction;

  this.package = require('../package.json');

  this.config = config;

  this._configDir = configOpts.dir;
  this._configFile = configOpts.file;

  this.pluginTypes = {
    BackgroundTask: require('./BackgroundTaskPlugin'),
    MessageHandler: require('./MessageHandlerPlugin'),
    ServerConnector: require('./ServerConnectorPlugin')
  };

  this.plugins = {
    ServerConnector: {},
    MessageHandler: {},
    BackgroundTask: {}
  };

  this.svrInstances = {};

  if(this.config === null) {
    this.createDefaultConfig();
  }

  if(this.config.defaultConfig) {
    global.logger.fatal('Edit your config file!');
    process.exit(0);
  }
}

util.inherits(AKP48, EventEmitter);

AKP48.prototype.getArgs = function (text) {
  var args = [], last = 0, quote = false, prev = '';
  for (var i = 0; i <= text.length; i++) {
    var eat = false;
    if (!quote && text[i] === ' ') {
      if (prev === '"' || prev === ' ') { // Eat quotes and spaces
        last++;
      } else {
        eat = true;
      }
    } else if (text[i] === '"' && prev !== '\\') { // Quote and not backquote
      if (quote) {
        eat = true;
      } else {
        last++;
      }
      quote = !quote;
    }
    if (eat) {
      // Add substring from last -> current, removing backslash'd quotes
      args.push(text.substring(last, i).replace('\\"', '"'));
      last = i + 1;
    }
    prev = text[i];
  }
  return args;
};

AKP48.prototype.onMessage = function (data) {
  if(!data || !data.rawLine) {return;} //if we don't have a context or we don't have text, don't continue.
  var line = data.rawLine;
  var self = this;
  var anyCmds = false;
  var lastResp = '';

  var delimiters = data.delimiters || [];
  delete data.delimiters;

  function isCommand(text) {
    for (var delimit of delimiters) {
      if (text.startsWith(delimit)) {
        return delimit.length;
      }
    }
    return 0;
  }
  var keys = Object.keys(data);
  function extend(base) {
    for (var key of keys) {
      base[key] = data[key];
    }
  }

  var contexts = [];
  // Build contexts
  line.split(/[^\\]\|/).forEach(function (text) {
    var args = this.getArgs(text);
    var isCmd = isCommand(args[0]);
    contexts.push(extend({
      text: text.substring(isCmd).trim(),
      args: args,
      isCmd: isCmd,
    }));
  });

  this.emit('fullMsg', line, contexts[0]);

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
    global.logger.stupid(`AKP48: Sending emote to ${pluginInstance}.`);
    this.emit('emote_'+pluginInstance, to, message, context);
  } else if (context.isAlert)  {
    global.logger.stupid(`AKP48: Sending alert to all instances.`);
    this.emit('alert', message);
  } else {
    global.logger.stupid(`AKP48: Sending message to ${pluginInstance}.`);
    this.emit('msg_'+pluginInstance, to, message, context);
  }
};

AKP48.prototype.sentMessage = function (to, message, context) {
  if(context.isEmote) {
    global.logger.silly(`AKP48: Emote sent to ${to}.`);
  } else if (context.isAlert) {
    global.logger.silly(`AKP48: Alert sent to ${to}.`);
  } else {
    global.logger.silly(`AKP48: Message sent to ${to}.`);
  }

  this.emit('sendMsg', to, message, context);
};

AKP48.prototype.start = function (persistentObjects) {
  var self = this;
  return new Promise(function(resolve) {
    if(!persistentObjects) {
      global.logger.info(`AKP48: Starting bot.`);
    } else {
      global.logger.info(`AKP48: Reloading bot.`);
    }

    //for each server in the config, load
    for (var i = 0; i < self.config.servers.length; i++) {
      var svr = self.config.servers[i];
      if(!svr._id) {
        self.config.servers[i]._id = uuid.v4();
        self.saveConfig(self.config);
      }

      global.logger.debug(`AKP48: Loading server ${svr._id}.`);

      if(!self.plugins.ServerConnector[svr.plugin.toLowerCase()]) {
        global.logger.error('AKP48: Invalid plugin "%s" specified in config! Server %s.', svr.plugin, svr._id);
      } else if (svr.disabled) {
        global.logger.verbose('AKP48: Server %s is marked as disabled. Not loading module.', svr._id);
      } else {
        global.logger.verbose(`AKP48: Loading ${svr.plugin} module.`);
        var Plugin = self.plugins.ServerConnector[svr.plugin.toLowerCase()].module;
        var pluginInstance;
        try {
          if(persistentObjects) {
            pluginInstance = new Plugin(self, svr.config, svr._id, persistentObjects[svr._id]);
          } else {
            pluginInstance = new Plugin(self, svr.config, svr._id);
          }
          self.svrInstances[svr._id] = pluginInstance;
        } catch(e) {
          global.logger.error(`AKP48: Error encountered loading ${svr._id}! ServerConnector not loaded. Error: ${e.message}`);
        }
      }
    }

    for (var instance in self.svrInstances) {
      if (self.svrInstances.hasOwnProperty(instance)) {
        global.logger.verbose(`AKP48: Connecting instance ${instance}.`);
        self.svrInstances[instance].connect();
      }
    }

    resolve(true);
  });
};

AKP48.prototype.loadPlugins = function () {
  var self = this;
  var proms = [];

  global.logger.debug(`AKP48: Loading plugins from npm.`);
  var package = require('../package.json');
  for (var name in package.dependencies) {
    if (package.dependencies.hasOwnProperty(name)) {
      if(name.toLowerCase().startsWith('akp48-plugin-')) {
        proms.push(new Promise(function (resolve) {
          global.logger.verbose(`AKP48: Loading ${name}.`);
          try {
            var plugin = require(name);
            name = plugin.pluginName || name; // allow plugins to override name.
            var plg = {
              conf: null,
              module: plugin,
              name: name
            };

            var conf = null;

            if(self.config.plugins && self.config.plugins[name]) {
              conf = self.config.plugins[name];
            }

            if(plugin.type !== 'ServerConnector') {
              global.logger.silly(`AKP48: Creating instance of ${name}.`);
              plg.loaded = new plugin(self, conf); // jshint ignore:line
            }

            self.plugins[plugin.type][name.toLowerCase()] = plg;
            global.logger.verbose(`AKP48: ${name} loaded.`);
          } catch(e) {
            global.logger.error(`AKP48: Error encountered loading ${name}! Plugin not loaded. Error: ${e.message}`, e);
          }
          resolve(true);
        }));
      }
    }
  }
  global.logger.debug(`AKP48: Finished loading plugins from npm.`);

  proms.push(new Promise(function (resolve, reject) {
    var pluginPath = path.resolve(self._configDir, 'plugins/*/plugin.json');
    global.logger.debug(`AKP48: Loading plugins from plugins folder. (${pluginPath})`);
    glob(pluginPath, function(err, files) {
      if (err) return reject(err);
      for (var i = 0; i < files.length; i++) {
        var dir = path.dirname(files[i]);
        var info = require(path.resolve(files[i]));
        if (!info.name || !info.type || !info.main) {
          global.logger.error(`AKP48: Skipping ${files[i]}. File missing required information.`);
          continue;
        }
        global.logger.verbose(`AKP48: Loading ${info.name}.`);
        try {
          var plugin = {
            name: info.name,
            info: info,
            module: require(path.resolve(dir, info.main)),
            config: null
          };

          if(self.config.plugins && self.config.plugins[info.name.toLowerCase()]) {
            plugin.config = self.config.plugins[info.name.toLowerCase()];
          }

          if(info.type !== 'ServerConnector') {
            global.logger.silly(`AKP48: Creating instance of ${info.name}.`);
            plugin.loaded = new plugin.module(self, plugin.config);
          }

          self.plugins[info.type][info.name.toLowerCase()] = plugin;
        } catch(e) {
          global.logger.error(`AKP48: Error encountered loading ${info.name}! Plugin not loaded. Error: ${e.message}`, e);
        }
      }
      global.logger.debug(`AKP48: Finished loading plugins from plugins folder.`);
      resolve(true);
    });
  }));

  return Promise.all(proms);
};

AKP48.prototype.getPluginInstance = function (type, plugin) {
  if(!this.plugins[type]) {return null;}
  return this.plugins[type][plugin].loaded || null;
};

AKP48.prototype.createDefaultConfig = function () {
  global.logger.verbose(`AKP48: Creating default config file.`);
  var conf = {
    defaultConfig: 'DELETE THIS KEY OR THE BOT WON\'T START.',
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
      level: 'info',
      fileLevel: 'silly'
    }
  };

  this.saveConfig(conf);
};

AKP48.prototype.saveConfig = function (conf, pluginName, isServerInstance) {
  global.logger.verbose(`AKP48: Saving config file.`);
  var config = this.config;
  if(isServerInstance) {
    if(pluginName) {
      for (var i = 0; i < config.servers.length; i++) {
        if(config.servers[i]._id === pluginName) {
          config.servers[i].config = conf;
        }
      }
    } else {
      global.logger.error(`AKP48: Invalid config save settings. Aborting config save.`);
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

  //make config directory, if it doesn't exist.
  require('mkdirp').sync(this._configDir);

  //if the config is default
  if(conf.defaultConfig) {
    // if we can access the file, that means there's already a config.json here.
    // we don't want to overwrite it with our changes, since it may already have
    // information in it, and it could simply be a JSON error that got us here.
    try {
      var fs = require('fs');
      fs.accessSync(this._configFile, fs.F_OK);
      global.logger.error('Edit your config file!');
      process.exit(0);
    } catch(e) {
      //this is only reached if config.json does not exist
      jsonfile.writeFileSync(this._configFile, config, {spaces: 2});
      this.config = config;
    }
  } else {
    // if the config is not default, we don't care
    // just save the file.
    jsonfile.writeFileSync(this._configFile, config, {spaces: 2});
    this.config = config;
  }
};
//jshint ignore:start
AKP48.prototype.unloadPlugins = function () {
  var plugins = [];

  for (var plugin in this.plugins.MessageHandler) {
    if (this.plugins.MessageHandler.hasOwnProperty(plugin)) {
      plugins.push(this.plugins.MessageHandler[plugin].loaded);
    }
  }

  for (var plugin in this.plugins.BackgroundTask) {
    if (this.plugins.BackgroundTask.hasOwnProperty(plugin)) {
      plugins.push(this.plugins.BackgroundTask[plugin].loaded);
    }
  }

  return Promise.map(plugins, plugin => new Promise(function(resolve) {
    global.logger.verbose(`AKP48: Unloading ${plugin._pluginName}.`);
    resolve(plugin.unload());
  //timeout makes us error out after 500ms.
  }).timeout(Math.min(plugin.timeout || 500, 2000), `${plugin._pluginName} took too long to unload`).then(function(){
    global.logger.verbose(`AKP48: ${plugin._pluginName} unloaded.`);
  },function(err){
    global.logger.error(`AKP48: ${plugin._pluginName} encountered an error while unloading: ${err}`);
  }));
};
//jshint ignore:end

AKP48.prototype.shutdown = function (msg) {
  this.emit('alert', `Shutting down...`);

  for (var svr in this.svrInstances) {
    if (this.svrInstances.hasOwnProperty(svr)) {
      global.logger.verbose(`AKP48: Sending disconnect to ${svr}.`);
      this.svrInstances[svr].disconnect(msg);
    }
  }

  this.unloadPlugins().catch(Promise.TimeoutError, function(error) {
    global.logger.error('AKP48: ' + error);
  }).finally(function() {
    global.logger.info(`AKP48: Shutting down.`);
    process.exit(0);
  });
};

AKP48.prototype.reload = function () {
  if (this.reloading) return; // jshint ignore:line
  this.reloading = true;
  var self = this;
  this.emit('alert', `Reloading...`);
  global.logger.debug(`AKP48: Unloading plugins and storing server connection data.`);
  var persistentObjects = {};
  //save persistentObjects for all servers.
  for (var svr in this.svrInstances) {
    if (this.svrInstances.hasOwnProperty(svr)) {
      global.logger.verbose(`AKP48: Storing data from ${svr}.`);
      persistentObjects[svr] = this.svrInstances[svr].getPersistentObjects();
      global.logger.verbose(`AKP48: Disconnecting and deleting ${svr}.`);
      if(!persistentObjects[svr]) {
        this.svrInstances[svr].disconnect();
      }
      delete this.svrInstances[svr];
    }
  }

  this.unloadPlugins().catch(Promise.TimeoutError, function(error) {
    global.logger.error('AKP48: ' + error);
  }).finally(function() {
    global.logger.debug(`AKP48: Clearing require cache.`);
    for (var prop in require._cache) {
      if (require._cache.hasOwnProperty(prop)) {
        if (prop.endsWith('.node')) {
          global.logger.warn(`AKP48: Skipping _cached file: ${prop}`);
          continue;
        }
        global.logger.stupid(`AKP48: Deleting file ${prop} from _cache.`);
        delete require._cache[prop];
      }
    }

    for (var prop in require.cache) { //jshint ignore:line
      if (require.cache.hasOwnProperty(prop)) {
        if (prop.endsWith('.node')) {
          global.logger.warn(`AKP48: Skipping cached file: ${prop}`);
          continue;
        }
        global.logger.stupid(`AKP48: Deleting file ${prop} from cache.`);
        delete require.cache[prop];
      }
    }

    //stop plugins from listening to us.
    self.removeAllListeners();

    //reset variables.
    self.plugins = {
      ServerConnector: {},
      MessageHandler: {},
      BackgroundTask: {}
    };

    self.svrInstances = {};

    //reload config
    self.config = require('../config.json');

    //time to reload
    global.logger.debug('AKP48: Reloading.');
    self.reloadFunction(persistentObjects, self._startTime);
  });
};

AKP48.prototype.getUUID = function () {
  return uuid.v4();
};

module.exports = AKP48;
