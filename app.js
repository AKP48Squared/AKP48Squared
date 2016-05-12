#!/usr/bin/env node
function load(persistObjs, startTime) {
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
  global.AKP48 = new AKP48(config, {dir: getConfigDir(), file: getConfigFile()}, reload, persistObjs, startTime);
}

function reload(persistObjs, startTime) {
  delete global.AKP48;
  global.logger.info('Reloading AKP48.');
  delete global.logger;
  load(persistObjs, startTime);
}

function getConfigDir() {
  //argv contains a nice object with our arguments. See https://www.npmjs.com/package/minimist for more details.
  var argv = require('minimist')(process.argv.slice(2));
  var path = require('path');
  var homedir = require('homedir');

  var conf = argv.config || argv.conf;

  if(conf) {
    return path.resolve(path.dirname(conf));
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
  //argv contains a nice object with our arguments. See https://www.npmjs.com/package/minimist for more details.
  var argv = require('minimist')(process.argv.slice(2));
  var path = require('path');
  var conf = argv.config || argv.conf;

  if(conf) {
    return path.resolve(conf);
  }

  return path.resolve(getConfigDir(), 'config.json');
}

load();

process.on('uncaughtException', function(err) {
  global.logger.error(`Uncaught Exception! Error: ${err}.`);
  console.log(err.stack);
});
