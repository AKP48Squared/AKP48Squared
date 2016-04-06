'use strict';
const ServerConnectorPlugin = require('../../lib/ServerConnectorPlugin');
const irc = require('irc');

class IRC extends ServerConnectorPlugin {
  constructor(config, id, AKP48) {
    super('IRC', AKP48);
    this._id = id;
    this._config = config;
    this._defaultCommandDelimiters = ['!', '.'];
    var self = this;
    if(!config || !config.server || !config.nick) {
      throw new Error('Required options missing from config!');
    }
    this._client = new irc.Client(config.server, config.nick, {
      autoRejoin: true,
      autoConnect: false,
      port: config.port || 6667,
      userName: config.userName || 'AKP48',
      realName: config.realName || 'AKP48',
      channels: config.channels || []
    });
    this._client.on('message', function(nick, to, text, message) {
      if(to === config.nick) { to = nick; }
      self._AKP48.onMessage(text, self.createContextFromMessage(message, to));
    });

    this._AKP48.on('msg_'+this._id, function(to, message, context) {
      if(!context.noPrefix) {message = `${context.nick}: ${message}`;}
      self._client.say(to, message);
      self._AKP48.sentMessage(to, message, context);
    });
  }

  connect() {
    this._client.connect();
  }

  disconnect(msg) {
    this._client.disconnect(msg || 'Goodbye.');
  }
}

IRC.prototype.createContextFromMessage = function (message, to) {
  var delimiterLength = this.isTextACommand(message.args[1], to);
  if(delimiterLength) {
    message.args[1] = message.args[1].slice(delimiterLength).trim();
  }

  return {
    rawMessage: message,
    nick: message.nick,
    user: message.prefix,
    text: message.args[1],
    to: to,
    myNick: this._client.nick,
    instanceId: this._id,
    instanceType: 'irc',
    instance: this,
    isCmd: (delimiterLength ? true : false)
  };
};

IRC.prototype.getChannelConfig = function (channel) {
  if(!this._config.chanConfig) {return {};}
  return this._config.chanConfig[channel] || {};
};

IRC.prototype.isTextACommand = function (text, channel) {
  var delimit = this.getChannelConfig(channel).commandDelimiters || this._config.commandDelimiters || this._defaultCommandDelimiters;
  for (var i = 0; i < delimit.length; i++) {
    if(text.startsWith(delimit[i])) {
      return delimit[i].length;
    }
  }

  return false;
};

module.exports = IRC;
