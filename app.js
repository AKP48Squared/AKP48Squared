require('./lib/polyfill'); //load polyfill
var logger = require('./lib/Logger');
logger.info('AKP48 is starting.');
var AKP48 = require('./lib/AKP48');
var config;

try {
  config = require('./config.json');
} catch(e) {
  //no config, so set config to null.
  config = null;
}

//logger goes in global scope.
GLOBAL.logger = logger;

//load the bot.
GLOBAL.AKP48 = new AKP48(config);
