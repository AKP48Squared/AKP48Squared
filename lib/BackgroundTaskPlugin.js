'use strict';
const Plugin = require('./Plugin');
const PluginTypes = require('./PluginTypes');

class BackgroundTaskPlugin extends Plugin {
  constructor(pluginName, AKP48, config) {
    super(pluginName, PluginTypes.BackgroundTask, AKP48, config);
  }
}

module.exports = BackgroundTaskPlugin;
