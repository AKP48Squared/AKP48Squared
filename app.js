function load(persistObjs, startTime) {
  require('./lib/polyfill'); //load polyfill
  var AKP48 = require('./lib/AKP48');
  var config;
  var logger;

  try {
    config = require('./config.json');
    if(!config.productionMode) {
      require('longjohn');
    }
  } catch(e) {
    console.log('No config file found.');
    //no config, so set config to null.
    config = null;
  }

  try {
    logger = require('./lib/Logger')(config.logger.level || 'info', config.logger.fileLevel || 'info');
  } catch(e) {
    logger = require('./lib/Logger')('info', 'info');
  }

  logger.info('AKP48 is starting.');

  //logger goes in global scope.
  GLOBAL.logger = logger;

  //load the bot.
  GLOBAL.AKP48 = new AKP48(config, reload, persistObjs, startTime);
}

function reload(persistObjs, startTime) {
  delete GLOBAL.AKP48;
  GLOBAL.logger.info('Reloading AKP48.');
  delete GLOBAL.logger;
  load(persistObjs, startTime);
}

load();

process.on('uncaughtException', function(err) {
  GLOBAL.logger.error(`Uncaught Exception! Error: ${err}.`);
});
