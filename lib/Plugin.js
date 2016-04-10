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
    return {};
  }

  unload() {
    return this.getPersistentObjects();
  }
}

module.exports = Plugin;
