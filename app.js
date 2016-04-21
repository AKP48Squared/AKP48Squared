function load(persistObjs) {
  require('./lib/polyfill'); //load polyfill
  var AKP48 = require('./lib/AKP48');
  var config;
  var logger;

  try {
    config = require('./config.json');
  } catch(e) {
    console.log('No config file found.');
    //no config, so set config to null.
    config = null;
  }

  try {
    logger = require('./lib/Logger')(config.logger.level || 'info');
  } catch(e) {
    logger = require('./lib/Logger')('info');
  }

  logger.info('AKP48 is starting.');

  //logger goes in global scope.
  GLOBAL.logger = logger;

  //load the bot.
  GLOBAL.AKP48 = new AKP48(config, reload, persistObjs);
}

function reload(persistObjs) {
  delete GLOBAL.AKP48;
  GLOBAL.logger.info('Reloading AKP48.');
  delete GLOBAL.logger;
  load(persistObjs);
}

load();
