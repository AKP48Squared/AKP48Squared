'use strict';
const Plugin = require('./Plugin');
const PluginTypes = require('./PluginTypes');

class ServerConnectorPlugin extends Plugin {
  init(id, config) {
    super.init(config);
    this._id = id;
  }

  get type() {
    return PluginTypes.ServerConnector;
  }

  saveConfig() {
    this._AKP48.saveConfig(this._config, this._id, true);
  }

  connect() {
    throw new TypeError('NotYetImplemented');
  }

  disconnect() {
    throw new TypeError('NotYetImplemented');
  }
}

module.exports = ServerConnectorPlugin;
