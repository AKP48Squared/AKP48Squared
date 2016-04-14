require('pmx').init({
  http: false, // HTTP routes logging (default: true)
  custom_probes: true, // Auto expose JS Loop Latency and HTTP req/s as custom metrics
  network: true, // Network monitoring at the application level
  ports: true  // Shows which ports your app is listening on (default: false)
});

require('./lib/polyfill'); //load polyfill
var AKP48 = require('./lib/AKP48');
var config;
var logger;

try {
  config = require('./config.json');
  logger = require('./lib/Logger')(config.logger.level || 'info');
} catch(e) {
  //no config, so set config to null.
  config = null;
  logger = require('./lib/Logger')('info');
}

logger.info('AKP48 is starting.');

//logger goes in global scope.
GLOBAL.logger = logger;

//load the bot.
GLOBAL.AKP48 = new AKP48(config);
