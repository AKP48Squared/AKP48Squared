const util = require('util');
const EventEmitter = require('events');
const glob = require('glob');
const path = require('path');
const Promise = require("bluebird"); // jshint ignore:line
const uuid = require('node-uuid');
const mkdirp = require('mkdirp');
const jsonfile = require('jsonfile');
jsonfile.spaces = 4;

function AKP48(config, configOpts, reloadFunction, startTime) {
  EventEmitter.call(this);

  this._started = false;

  this.Context = require('akp48-context');

  this.setMaxListeners(Infinity); // I wonder how many plugins we can actually support before performance starts to drop... I'm sure setting it to Infinity won't hurt.

  this._startTime = startTime || Date.now();

  this._pluginList = {};
    
  this._totalMsgCount = 0; //includes totalCmdCount.
  this._totalMsgChars = 0;
  this._totalCmdCount = 0;
  this._totalSentMsgCount = 0;

  this.reloadFunction = reloadFunction;

  this.package = require('../package.json');

  this.config = config;

  this._configDir = configOpts.dir;
  this._configFile = configOpts.file;

  this.pluginTypes = {
    Generic: require('./Plugin'),
    MessageHandler: require('./MessageHandlerPlugin'), // MessageHandler is a helper value
    ServerConnector: require('./ServerConnectorPlugin')
  };

  this.plugins = {
    ServerConnector: {},
    Generic: {}
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

AKP48.prototype.onMessage = function (context) {
  //surrounding this in a try...catch because if we don't have a context, context.isContext() might not exist.
  try{ if(!context || !context.isContext()) {return;} } catch(e) {return;} //if we don't have a context don't continue.

  this.emit('fullMsg', context);
  this._totalMsgCount++;
  this._totalMsgChars += context.text().length;

  if (context.isCommand()) {
    this._totalCmdCount++;  
    if(!context.permissions().includes('AKP48.banned')) {
      this.emit('cmd', context);
    }
  } else {
    if(context.hasURL()) {
      this.emit('url', context);
    }
    this.emit('msg', context);
  }
};

AKP48.prototype.sendMessage = function (message, context) {
  if(!message || !context) {
    //we need to figure out what we're working with.

    //if we've got nothing at all, we can't send a message.
    if(!message && !context) { return; }

    //if context is empty, we'll check message to see if it's a context.
    if(!context) {
      //if the message is not a context, we'll just return, since we won't know where to send a message anyway.
      try{ if(!message.isContext()) {return;} } catch(e) {return;}

      //if we make it here, we've got a context as the message parameter.
      context = message;
      message = context.text();
    }

    //if we've made it here, context isn't empty, so message must be.
    //we'll ensure that our context is actually a context, then set the message to what's in the context.
    try{ if(!context.isContext()) {return;} } catch(e) {return;}
    message = context.text();
  }

  var ctx = context.cloneWith({text: message});
  for (var i = 0; i < context.getCustomKeys().length; i++) {
    var k = context.getCustomKeys()[i];
    ctx.setCustomData(k, context.getCustomData(k));
  }
  
  this._totalSentMsgCount++;

  if (ctx.isAlert())  {
    global.logger.stupid(`AKP48: Sending alert to all instances.`);
    this.sendAlert(message);
  } else {
    this.emit('msg_'+ctx.instanceId(), ctx);
  }
};

AKP48.prototype.sendAlert = function (message) {
  this.emit('alert', new this.Context({
    instance: {id: 'GLOBAL', name: 'GLOBAL'},
    instanceType: 'GLOBAL',
    nick: 'GLOBAL',
    text: message,
    to: 'GLOBAL',
    user: `GLOBAL`,
    commandDelimiters: '',
    myNick: 'GLOBAL',
    permissions: [],
    isAlert: true
  }));
};

AKP48.prototype.logMessage = function (context) {
  this.emit('logMsg', context);
};

AKP48.prototype.start = function (persistentObjects) {
  if(this._started) {return;}
  var self = this;
  this._started = true;
  return new Promise(function(resolve) {
    if(!persistentObjects) {
      global.logger.info(`AKP48: Starting bot.`);
      // Add a blank object, always use the same constructor
      persistentObjects = {};
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
          pluginInstance = new Plugin(self);
          pluginInstance.init(svr._id, svr.config);
          pluginInstance.load(persistentObjects[svr._id]);
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

AKP48.prototype.initPlugin = function (name, module, dir) {
  var instance;
  try {
    instance = new module(this, name); //jshint ignore:line
  } catch(e) {
    return global.logger.error(`AKP48: Skipping ${name}. Error while creating module instance`, e);
  }
  if (!(instance instanceof this.pluginTypes.Generic)) {
    // This isn't a plugin, we can't load it
    return global.logger.error(`AKP48: Skipping ${name}. No plugin found.`);
  }

  name = instance.name || name; // allow plugins to override name.

  if (!dir) {
    dir = path.resolve(this._configDir, `plugins/${name}`); // If we weren't provided a directory, construct one ourselves.
    mkdirp(dir);
  }

  global.logger.verbose(`AKP48: Initializing ${name}.`);

  var plugin = {
    name: name,
    module: module,
    config: {},
    loaded: false,
  }, type = instance.type;

  if(this.plugins[type][name.toLowerCase()]) {
    return global.logger.info(`AKP48: Skipping ${name} because it has already been loaded from another source.`);
  }

  if (type.key !== 'ServerConnector') {
    plugin.loaded = instance;
    // Load the configuration
    if (this.config.plugins && this.config.plugins[name]) {
      // By using extend we don't leak live config references to plugins
      extend(plugin.config, this.config.plugins[name]);
      // TODO: Add new defaults
    } else {
      if(instance.getDefaultConfig()) {
        this.saveConfig(instance.getDefaultConfig(), name);
        extend(plugin.config, this.config.plugins[name]);
      }
    }
    // Initialize the plugin
    try {
      instance.init(plugin.config, dir);
    } catch (e) {
      this._pluginList[name].error = true;
      return global.logger.error(`AKP48: Error initializing ${name}.`, e);
    }
  } else {
    var addDefaultConfig = true;
    for (var i = 0; i < this.config.servers.length; i++) {
      if (this.config.servers[i].plugin === name) {
        addDefaultConfig = false;
        break;
      }
    }
    if(instance.getDefaultConfig() && addDefaultConfig) {
      this.saveConfig(instance.getDefaultConfig(), null, true);
    }
  }

  this.plugins[type][name.toLowerCase()] = plugin;

  global.logger.verbose(`AKP48: Finished initializing ${name}.`);
};

AKP48.prototype.loadPlugins = function () {
  var self = this;
  var plugins = [];

  // Load from plugins folder first, so we can have our own versions of default plugins.
  // The npm loader below will detect that we've already loaded a plugin with the same name,
  // and will refuse to load a new version, allowing the locally installed version to
  // override the node_modules version.
  (function getPluginsFromConfig() {
    var pluginPath = path.resolve(self._configDir, 'plugins/*/plugin.json');
    global.logger.debug(`AKP48: Getting plugins from plugins folder. (${pluginPath})`);
    glob.sync(pluginPath).forEach(function(file) {
      var dir = path.dirname(file);
      var info = require(path.resolve(file));
      if (!info.name || !info.main) {
        return global.logger.error(`AKP48: Skipping ${file}. File missing required information.`);
      }
        
      self._pluginList[info.name] = {
        name: info.name,
        error: false
      }

      var main = path.resolve(dir, info.main), module;
      try {
        module = require(main);
      } catch (e) {
        self._pluginList[info.name].error = true;
        return global.logger.error(`Error parsing ${main}.`, e);
      }

      plugins.push({name: info.name, module: module, dir: dir});
    });
    global.logger.debug(`AKP48: Finished getting plugins from plugins folder.`);
  })();

  (function getPluginsFromNpm() {
    global.logger.debug(`AKP48: Getting plugins from npm.`);
    var package = require('../package.json').dependencies;
    for (var name in package) { // jshint ignore:line
      if (!package.hasOwnProperty(name) || !name.toLowerCase().startsWith('akp48-plugin-')) {
        continue;
      }
        
      self._pluginList[name] = {
        name: name,
        error: false
      }
      
      var module;
      try {
        module = require(name);
      } catch (e) {
        global.logger.error(`Error parsing ${name}.`, e);
        self._pluginList[name].error = true;
        continue;
      }

      plugins.push({name: name, module: module});
    }
    global.logger.debug(`AKP48: Finished getting plugins from npm.`);
  })();

  return new Promise(function (resolve) {
    global.logger.debug('AKP48: Loading plugins.');

    if(!plugins.length) {
      global.logger.error('AKP48: No plugins found! AKP48 cannot run without plugins!');
      global.logger.error('AKP48: You can find plugins at https://git.io/vKngY or https://goo.gl/bxKxj1.');
      global.logger.error('AKP48: Shutting down.');
      process.exit(0);
    }

    plugins.forEach(function (data) {
      try {
        self.initPlugin(data.name, data.module, data.dir);
      } catch (e) {
        // Remove the plugin?
        return global.logger.error(`AKP48: Error while initializing ${data.name}.`, e);
      }
    });

    var genericPlugins = self.plugins.Generic;
    for (var name of Object.keys(genericPlugins)) {
      var plugin = genericPlugins[name].loaded;
      global.logger.verbose(`AKP48: Loading ${plugin.name}`);
      try {
        plugin.load();
      } catch (e) {
        // Remove the plugin?
        return global.logger.error(`AKP48: Error while loading ${plugin.name}.`, e);
      }
    }

    global.logger.debug('AKP48: Finished loading plugins');
    resolve(true);
  });
};

AKP48.prototype.getPluginInstance = function (type, plugin) {
  if(!this.plugins[type]) {return null;}
  return this.plugins[type][plugin].loaded || null;
};

AKP48.prototype.createDefaultConfig = function () {
  global.logger.verbose(`AKP48: Creating default config file.`);
  var conf = {
    defaultConfig: 'DELETE THIS KEY OR THE BOT WON\'T START.',
    servers: [],
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
      // no pluginName when isServerInstance is true means we're creating a new server.
      config.servers.push(conf);
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
  mkdirp.sync(this._configDir);

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
    global.logger.verbose(`AKP48: Unloading ${plugin.name}.`);
    resolve(plugin.unload());
  //timeout makes us error out after 500ms.
  }).timeout(Math.min(plugin.timeout || 500, 2000), `${plugin.name} took too long to unload`).then(function(){
    global.logger.verbose(`AKP48: ${plugin.name} unloaded.`);
  },function(err){
    global.logger.error(`AKP48: ${plugin.name} encountered an error while unloading: ${err}`);
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
    self.config = require(self._configFile);

    //time to reload
    global.logger.debug('AKP48: Reloading.');
    self.reloadFunction(persistentObjects, self._startTime);
  });
};

AKP48.prototype.getUUID = function () {
  return uuid.v4();
};

// Used to add new properties from original to target object
function extend(target, original) {
  if (!original || !target) { return; }
  for (var name of Object.keys(original)) {
    if (target.hasOwnProperty(name)) { continue; }
    target[name] = original[name];
  }
}

module.exports = AKP48;
