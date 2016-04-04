var AKP48 = require('./lib/AKP48');
var config;

try {
  config = require('config.json');
} catch(e) {
  //no config, so set config to empty object.
  config = {};
}

//load the bot.
var bot = new AKP48(config).start();
