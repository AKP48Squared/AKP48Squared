'use strict';
const Promise = require('bluebird'); //jshint ignore:line
const PluginTypes = require('./PluginTypes');
const DeprecationError = require('./DeprecationError');

class Plugin {
  constructor(AKP48, name) {
    this._name = name; // Plugin name
    this._config = {};
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
    if (!this._deprecatedName) {
      this._deprecatedName = true;
      global.logger.error(`The use of plugin.pluginName is deprecated. Please use plugin.name`, new DeprecationError());
    }
    return this.name;
  }
  
  get AKP48() {
    return this._AKP48;
  }

  get name() {
    return this._name;
  }
  
  get config() {
    return this._config;
  }
  
  get hasError() {
    return this._error;
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
