'use strict';
const Plugin = require('./Plugin');
const PluginTypes = require('./PluginTypes');

class ServerConnectorPlugin extends Plugin {
  constructor(pluginName, AKP48, config, id) {
    super(pluginName, PluginTypes.ServerConnector, AKP48, config);
    this._id = id;
  }

  connect() {
    throw new TypeError("NotYetImplemented");
  }

  disconnect() {
    throw new TypeError("NotYetImplemented");
  }
}

module.exports = ServerConnectorPlugin;
