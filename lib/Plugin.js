'use strict';

class Plugin {
  constructor(pluginName, type, AKP48) {
    this._type = type; // PluginTypes
    this._AKP48 = AKP48; // AKP48
    this._pluginName = pluginName; // String
  }

  get type() {
    return this._type;
  }

  get pluginName() {
    return this._pluginName;
  }

  getPersistentObjects() {
    throw new Error('NotYetImplementedError');
  }

  load() {
    throw new Error('NotYetImplementedError');
  }

  unload() {
    throw new Error('NotYetImplementedError');
  }
}

module.exports = Plugin;
