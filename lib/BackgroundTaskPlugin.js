'use strict';
const Plugin = require('./Plugin');
const PluginTypes = require('./PluginTypes');

class BackgroundTaskPlugin extends Plugin {
  constructor(pluginName, AKP48) {
    super(pluginName, PluginTypes.BackgroundTask, AKP48);
  }
}

module.exports = BackgroundTaskPlugin;
