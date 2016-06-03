'use strict';
const Promise = require('bluebird'); //jshint ignore:line
const PluginTypes = require('./PluginTypes');
const DeprecationError = require('./DeprecationError');

class Plugin {
  constructor(AKP48, name) {
    this._name = name; // Plugin name
    this._AKP48 = AKP48; // AKP48
    this._error = false; // Boolean, used to check if plugin is in error state.
  }
  
  // Called by AKP48 to initialize data
  init(config, directory) {
    this._config = config;
    this._dir = directory;
  }

  get type() {
    return PluginTypes.Generic;
  }

  get pluginName() {
    if (!this.deprecatedName) {
      this.deprecatedName = true;
      global.logger.error(`The use of plugin.pluginName is deprecated. Please use plugin.name`, new DeprecationError());
    }
    return this.name;
  }
  
  get name() {
    return this._name;
  }

  getPersistentObjects() {
    return {};
  }
  
  saveConfig() {
    this._AKP48.saveConfig(this._config, this._pluginName);
  }
  
  load() {
    // NOOP - designed to be overridden
  }

  unload() {
    return new Promise(function(resolve) {
      resolve(true);
    });
  }
  
  toString() {
    return this.name;
  }
}

module.exports = Plugin;
