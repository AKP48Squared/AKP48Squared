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
      GLOBAL.logger.error(`${self._pluginName}|${self._id}: Required server and/or nick options missing from config!`);
      this._error = true;
      return;
    }

    this._client = new irc.Client(config.server, config.nick, {
      autoRejoin: false,
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

    this._client.on('registered', function() {
      GLOBAL.logger.silly(`${self._pluginName}|${self._id}: Connected to ${self._config.server}.`);
    });

    this._client.on('invite', function(channel, from) {
      GLOBAL.logger.info(`${self._pluginName}|${self._id}: Invite to channel "${channel}" received from ${from}. Joining channel.`);
      self._client.join(channel, function() {
        var joinMsg = `Hello, everyone! I'm AKP48! I respond to commands and generally try to be helpful. For more information, say ".help"!`;
        self._client.say(channel, joinMsg);
        self._AKP48.sentMessage(channel, joinMsg, {
          myNick: self._client.nick,
          instanceId: self._id
        });
        self._AKP48.saveConfig(self._config, self._id);
      });
    });

    this._client.on('kick', function(channel, nick, by, reason) {
      if(nick === self._client.nick) {
        GLOBAL.logger.info(`${self._pluginName}|${self._id}: Kicked from ${channel} by ${by} for ${reason}. Removing channel from config.`);
        var index = self._config.channels.indexOf(channel);
        if(index > -1) {
          self._config.channels.splice(index, 1);
        }
        self._AKP48.saveConfig(self._config, self._id);
      }
    });

    this._client.on('error', function(message) {
      GLOBAL.logger.error(`${self._pluginName}|${self._id}: Error received from ${message.server}! ${message.command}: ${message.args}`);
    });

    this._AKP48.on('msg_'+this._id, function(to, message, context) {
      if(!context.noPrefix) {message = `${context.nick}: ${message}`;}
      self._client.say(to, message);
      self._AKP48.sentMessage(to, message, context);
    });
  }

  connect() {
    if(this._error) {
      GLOBAL.logger.error(`${this._pluginName}|${this._id}: Cannot connect. Check log for errors.`);
      return;
    }
    this._client.connect();
  }

  disconnect(msg) {
    if(this._error) {
      GLOBAL.logger.error(`${this._pluginName}|${this._id}: Cannot disconnect. Check log for errors.`);
      return;
    }
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
