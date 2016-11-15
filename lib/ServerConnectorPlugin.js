'use strict';
const Plugin = require('./Plugin');
const PluginTypes = require('./PluginTypes');
const TextDecorator = require('./TextDecorator');

class ServerConnectorPlugin extends Plugin {
  init(id, config) {
    super.init(config);
    this._id = id;
  }

  get type() {
    return PluginTypes.ServerConnector;
  }

  get TextDecorator() {
    return new TextDecorator();
  }

  saveConfig() {
    this._AKP48.saveConfig(this._config, this._id, true);
  }

  getPermissions() {
    return [];
  }

  connect() {
    throw new TypeError('NotYetImplemented');
  }

  disconnect() {
    throw new TypeError('NotYetImplemented');
  }
}

module.exports = ServerConnectorPlugin;
