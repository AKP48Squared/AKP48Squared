const moment = require('moment-timezone'); // moment helps with time parsing.

function Uptime() {
  this.names = ['uptime', 'up', '↑', '▲', '🕐'];
}

Uptime.prototype.respond = function (context) {
  var startTime = GLOBAL.AKP48._startTime;
  var formattedTime = moment.tz(startTime, 'UTC');

  if(moment.tz.zone(context.text)) {
    formattedTime = moment(startTime).tz(context.text);
  }

  formattedTime = formattedTime.format('[on] YYYY/MM/DD [at] HH:mm:ss z');

  return `I started ${moment(startTime).fromNow()}, ${formattedTime}.`;
};

module.exports = Uptime;
