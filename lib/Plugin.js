'use strict';
const Promise = require('bluebird'); //jshint ignore:line

class Plugin {
  constructor(pluginName, type, AKP48) {
    this._type = type; // PluginTypes
    this._AKP48 = AKP48; // AKP48
    this._pluginName = pluginName; // String
    this._error = false; // Boolean, used to check if plugin is in error state.
  }

  get type() {
    return this._type;
  }

  get pluginName() {
    return this._pluginName;
  }

  getPersistentObjects() {
    return {};
  }

  unload() {
    return new Promise(function(resolve) {
      resolve(true);
    });
  }
}

module.exports = Plugin;
