'use strict';
const ServerConnectorPlugin = require('../../lib/ServerConnectorPlugin');
const irc = require('tmi.js');

class Twitch extends ServerConnectorPlugin {
  constructor(config, id, AKP48, persistentObjects) {
    super('Twitch', AKP48);
    this._id = id;
    this._config = config;
    this._defaultCommandDelimiters = ['!', '.'];
    var self = this;
    if(!config || !config.channels) {
      global.logger.error(`${self._pluginName}|${self._id}: Required channels option missing from config!`);
      this._error = true;
      return;
    }

    if(!config.identity || !config.identity.username || !config.identity.password) {
      global.logger.warn(`${self._pluginName}|${self._id}: No complete identity found in config! Are you sure this is what you want?`);
    }

    if(persistentObjects) {
      this._client = persistentObjects.client;
      this._client.removeAllListeners('chat');
      this._client.removeAllListeners('whisper');
      this._client.removeAllListeners('connecting');
      this._client.removeAllListeners('connected');
      this._client.removeAllListeners('disconnected');
      this._connected = true;
    } else {
      this._client = new irc.client(config);
    }

    this._client.on('chat', function(to, user, text, sentFromSelf) {
      if(to === self._client.getUsername()) { to = user.username; }
      if(!sentFromSelf) {
        self._AKP48.onMessage(text, self.createContexts(to, user, text));
      }
    });

    this._client.on('whisper', function(user, text) {
      var to = user.username;
      self._AKP48.onMessage(text, self.createContexts(to, user, text, true));
    });

    this._client.on('connecting', function(address, port) {
      global.logger.verbose(`${self._pluginName}|${self._id}: Connecting to ${address}:${port}.`);
    });

    this._client.on('connected', function(address, port) {
      global.logger.debug(`${self._pluginName}|${self._id}: Connected to ${address}:${port}.`);
      self._AKP48.emit('serverConnect', self._id, self);
    });

    this._client.on('disconnected', function(reason) {
      global.logger.debug(`${self._pluginName}|${self._id}: Disconnected from server for "${reason}".`);
    });

    this._client.on('error', function(message) {
      global.logger.error(`${self._pluginName}|${self._id}: Error received from ${message.server}! ${message.command}: ${message.args}`);
    });

    this._AKP48.on('msg_'+this._id, function(to, message, context) {
      if(!context.noPrefix) {message = `@${context.nick}: ${message}`;}
      if(context.isWhisper) {
        self._client.whisper(to, message);
      } else {
        self._client.say(to, message);
      }
      self._AKP48.sentMessage(to, message, context);
    });

    this._AKP48.on('emote_'+this._id, function(to, message, context) {
      self._client.action(to, message);
      self._AKP48.sentMessage(to, message, context);
    });
  }

  connect() {
    if(this._error) {
      global.logger.error(`${this._pluginName}|${this._id}: Cannot connect. Check log for errors.`);
      return;
    }
    if(this._connected) {
      global.logger.debug(`${this._pluginName}|${this._id}: Using previous connection.`);
      this._connected = false;
    } else {
      this._client.connect();
    }
  }

  disconnect(msg) {
    if(this._error) {
      global.logger.error(`${this._pluginName}|${this._id}: Cannot disconnect. Check log for errors.`);
      return;
    }
    this._client.disconnect(msg || 'Goodbye.');
  }
}

Twitch.prototype.createContexts = function (to, user, text, isWhisper) {
  var textArray = text.split(/[^\\]\|/);
  var ctxs = [];

  for (var i = 0; i < textArray.length; i++) {
    textArray[i] = textArray[i].trim();
    var delimiterLength = this.isTextACommand(textArray[i], to);
    if(delimiterLength) {
      textArray[i] = textArray[i].slice(delimiterLength).trim();
    }

    var ctx = {
      rawMessage: text,
      nick: user['display-name'],
      user: user.username,
      rawText: text,
      text: textArray[i].trim(),
      to: to,
      myNick: this._client.getUsername(),
      instanceId: this._id,
      instanceType: 'twitch',
      instance: this,
      isCmd: delimiterLength ? true : false
    };

    if(isWhisper) {
      ctx.isWhisper = true;
    }

    ctxs.push(ctx);
  }

  ctxs[ctxs.length-1].last = true;

  return ctxs;
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

Twitch.prototype.getPersistentObjects = function () {
  return {
    client: this._client
  };
};

module.exports = Twitch;
