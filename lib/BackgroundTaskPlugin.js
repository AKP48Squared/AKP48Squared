'use strict';
const Plugin = require('./Plugin');
const PluginTypes = require('./PluginTypes');

class BackgroundTaskPlugin extends Plugin {
  constructor(AKP48, name) {
    super(AKP48, name);
    global.logger.error(`${name || this.constructor.name} is using deprecated class BackgroundTaskPlugin.`);
  }
}

module.exports = BackgroundTaskPlugin;
