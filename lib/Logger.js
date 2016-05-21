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
  return level.toUpperCase();
};

var formatter = function(options) {
  function colorize (message, type) {
    var color = type ? options.colorize && options.colorize !== 'message' : options.colorize === 'all' || options.colorize === 'message';
    if (options.colorize === false || (!color && type !== 'stack')) return message;
    return winston.config.colorize(options.level, message);
  }
  // Return string will be passed to logger.
  var output = '';
  if (options.timestamp()) {
    output += options.timestamp() + ' | ';
  }
  if (options.showLevel === undefined ? true : options.showLevel) {
    output += colorize(formatLevel(options.level), 'level');
    output += ' | ';
  }
  output += colorize(options.message);
  if (options.meta && options.meta.stack) {
    var stack = options.meta.stack;
    if (stack && Array.isArray(stack)) {
      output += '\n' + colorize(stack.join('\n'), 'stack');
    } else {
      output += '\n' + colorize(stack, 'stack');
    }
  } else if (options.meta && Object.keys(options.meta).length) {
    output += '\n\t' + JSON.stringify(options.meta);
  }
  return output;
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
