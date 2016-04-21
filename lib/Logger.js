var winston = require('winston');

var timestamp = function() {
  var now = new Date();
  var date = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ];
  var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];

  //pad time & date with leading zeroes
  for (var i=0; i < 3; i++) {
    if (time[i] < 10) {
      time[i] = '0' + time[i];
    }
    if (date[i] < 10) {
      date[i] = '0' + date[i];
    }
  }
  return `${date.join('/')} ${time.join(':')}`;
};

var formatLevel = function(level) {
  while (level.length < 5) {
    level = ' ' + level;
  }
  return level;
};

var formatter = function(options) {
  // Return string will be passed to logger.
  return options.timestamp() +' | '+ formatLevel(options.level.toUpperCase()) +' | '+ (undefined !== options.message ? options.message : '') +
    (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
};

module.exports = function(level) {
  var logPath = require('path').resolve(require('app-root-path').path, 'logs/AKP48.log');
  var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({
        timestamp: timestamp,
        formatter: formatter,
        level: level
      }),
      new (winston.transports.File)({
        filename: logPath,
        timestamp: timestamp,
        formatter: formatter,
        level: 'silly'
      })
    ]
  });

  return logger;
};
