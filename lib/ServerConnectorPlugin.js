'use strict';
const Plugin = require('./Plugin');
const PluginTypes = require('./PluginTypes');

class ServerConnectorPlugin extends Plugin {
  constructor(pluginName, AKP48) {
    super(pluginName, PluginTypes.ServerConnector, AKP48);
    this.msgResponders = {};
  }

  connect() {
    throw new Error('NotYetImplementedError');
  }

  disconnect() {
    throw new Error('NotYetImplementedError');
  }
}

module.exports = ServerConnectorPlugin;
