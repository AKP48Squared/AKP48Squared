require('./lib/polyfill'); //load polyfill
var AKP48 = require('./lib/AKP48');
var config;

try {
  config = require('./config.json');
} catch(e) {
  //no config, so set config to null.
  config = null;
}

//load the bot.
GLOBAL.AKP48 = new AKP48(config);
