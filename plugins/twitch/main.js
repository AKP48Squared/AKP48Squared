'use strict';
const ServerConnectorPlugin = require('../../lib/ServerConnectorPlugin');
const irc = require('tmi.js');

class Twitch extends ServerConnectorPlugin {
  constructor(config, id, AKP48) {
    super('Twitch', AKP48);
    this._id = id;
    this._config = config;
    this._defaultCommandDelimiters = ['!', '.'];
    var self = this;
    if(!config || !config.channels) {
      GLOBAL.logger.error(`${self._pluginName}|${self._id}: Required channels option missing from config!`);
      this._error = true;
      return;
    }

    if(!config.identity || !config.identity.username || !config.identity.password) {
      GLOBAL.logger.warn(`${self._pluginName}|${self._id}: No complete identity found in config! Are you sure this is what you want?`);
    }

    this._client = new irc.client(config);

    this._client.on('chat', function(to, user, text, sentFromSelf) {
      if(to === self._client.getUsername()) { to = user.username; }
      if(!sentFromSelf) {
        self._AKP48.onMessage(text, self.createContext(to, user, text));
      }
    });

    this._client.on('connecting', function(address, port) {
      GLOBAL.logger.silly(`${self._pluginName}|${self._id}: Connecting to ${address}:${port}.`);
    });

    this._client.on('connected', function(address, port) {
      GLOBAL.logger.silly(`${self._pluginName}|${self._id}: Connected to ${address}:${port}.`);
    });

    this._client.on('disconnected', function(reason) {
      GLOBAL.logger.silly(`${self._pluginName}|${self._id}: Disconnected from server for "${reason}".`);
    });

    this._client.on('error', function(message) {
      GLOBAL.logger.error(`${self._pluginName}|${self._id}: Error received from ${message.server}! ${message.command}: ${message.args}`);
    });

    this._AKP48.on('msg_'+this._id, function(to, message, context) {
      if(!context.noPrefix) {message = `@${context.nick}: ${message}`;}
      self._client.say(to, message);
      self._AKP48.sentMessage(to, message, context);
    });

    this._AKP48.on('emote_'+this._id, function(to, message, context) {
      self._client.action(to, message);
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

Twitch.prototype.createContext = function (to, user, text) {
  var delimiterLength = this.isTextACommand(text, to);
  if(delimiterLength) {
    text = text.slice(delimiterLength).trim();
  }

  return {
    rawMessage: text,
    nick: user['display-name'],
    user: user.username,
    text: text,
    to: to,
    myNick: this._client.getUsername(),
    instanceId: this._id,
    instanceType: 'twitch',
    instance: this,
    isCmd: (delimiterLength ? true : false)
  };
};

Twitch.prototype.getChannelConfig = function (channel) {
  if(!this._config.chanConfig) {return {};}
  return this._config.chanConfig[channel] || {};
};

Twitch.prototype.isTextACommand = function (text, channel) {
  var delimit = this.getChannelConfig(channel).commandDelimiters || this._config.commandDelimiters || this._defaultCommandDelimiters;
  for (var i = 0; i < delimit.length; i++) {
    if(text.toLowerCase().startsWith(delimit[i].toLowerCase())) {
      return delimit[i].length;
    }
  }

  return false;
};

module.exports = Twitch;
