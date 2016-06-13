#!/usr/bin/env node
function load(persistObjs, startTime, isReload) {
  require('./lib/polyfill'); //load polyfill
  var AKP48 = require('./lib/AKP48');
  var config;
  var logger;

  try {
    config = require(getConfigFile());
  } catch(e) {
    console.log('No config file found.');
    //no config, so set config to null.
    config = null;
  }

  try {
    logger = require('./lib/Logger')(config.logger.level || 'info', config.logger.fileLevel || 'info', getConfigDir());
  } catch(e) {
    logger = require('./lib/Logger')('info', 'info', getConfigDir());
  }

  try {
    if(!config.productionMode) {
      require('longjohn');
    }
  } catch(e) {}

  logger.info('AKP48 is starting.');
  logger.info(`Configuration loaded from ${getConfigFile()}.`);

  //logger goes in global scope.
  global.logger = logger;

  //load the bot.
  global.AKP48 = new AKP48(config, {dir: getConfigDir(), file: getConfigFile()}, reload, startTime);

  //loads all available plugins.
  global.AKP48.loadPlugins().then(function() {
    //start the bot.
    global.AKP48.start(persistObjs).then(function(){
      global.AKP48.emit('loadFinished');
      if(isReload) {
        global.AKP48.sendAlert('Reload complete.');
      }
    });
  });
}

function reload(persistObjs, startTime) {
  delete global.AKP48;
  global.logger.info('Reloading AKP48.');
  delete global.logger;
  load(persistObjs, startTime, true);
}

//flags contains a nice object with our arguments. See https://www.npmjs.com/package/minimist for more details.
var flags = require('minimist')(process.argv.slice(2), {alias: {
  dir: 'd',
  config: 'conf',
}, default: {
  config: 'config.json',
}});

function getConfigDir() {
  var path = require('path');
  var homedir = require('homedir');

  var dir = flags.dir;

  if(dir) {
    return path.resolve(path.dirname(dir));
  }

  switch(process.platform) {
    case 'darwin':
      return path.join(process.env.HOME, 'Library/Application Support/AKP48Squared');
    case 'win32':
      return path.join(process.env.APPDATA, 'AKP48Squared');
    default:
      return path.join(homedir(), '.akp48squared');
  }
}

function getConfigFile() {
  var path = require('path');

  return path.resolve(getConfigDir(), flags.config);
}

load();

process.on('uncaughtException', function(err) {
  global.logger.error(`Uncaught Exception! Error: ${err}.`);
  console.log(err.stack);
});
