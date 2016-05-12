var winston = require('winston');

var timestamp = function() {
  var now = new Date();
  var date = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ];
  var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];
  var ms = now.getMilliseconds();

  //pad time & date with leading zeroes
  for (var i=0; i < 3; i++) {
    if (time[i] < 10) {
      time[i] = '0' + time[i];
    }
    if (date[i] < 10) {
      date[i] = '0' + date[i];
    }
  }
  if(ms < 10) {ms = '00' + ms;}
  else if(ms < 100) {ms = '0' + ms;}

  return `${date.join('/')} ${time.join(':')}.${ms}`;
};

var formatLevel = function(level) {
  while (level.length < 7) {
    level = ' ' + level;
  }
  return level;
};

var formatter = function(options) {
  // Return string will be passed to logger.
  return options.timestamp() +' | '+ formatLevel(options.level.toUpperCase()) +' | '+ (undefined !== options.message ? options.message : '') +
    (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
};

var levels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  verbose: 5,
  silly: 6,
  stupid: 7
};

var colors = {
  fatal: 'red',
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  verbose: 'cyan',
  silly: 'magenta',
  stupid: 'grey'
};

module.exports = function(level, fileLevel, configDir) {
  //make log directory, if it doesn't exist.
  require('mkdirp').sync(require('path').resolve(configDir, 'logs'));

  var logPath = require('path').resolve(configDir, 'logs/AKP48.log');

  var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({
        timestamp: timestamp,
        formatter: formatter,
        level: level,
        colorize: true
      }),
      new (winston.transports.File)({
        filename: logPath,
        timestamp: timestamp,
        formatter: formatter,
        level: fileLevel
      })
    ],
    levels: levels,
    color: colors
  });

  return logger;
};
