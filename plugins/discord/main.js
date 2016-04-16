'use strict';
const ServerConnectorPlugin = require('../../lib/ServerConnectorPlugin');
const Discordie = require('discordie');
var c = require('irc-colors');

class Discord extends ServerConnectorPlugin {
  constructor(config, id, AKP48, persistentObjects) {
    super('Discord', AKP48);
    this._id = id;
    this._config = config;
    this._defaultCommandDelimiters = ['!', '.'];
    var self = this;
    if(!config || !config.token) {
      GLOBAL.logger.error(`${self._pluginName}|${self._id}: Required token option missing from config!`);
      this._error = true;
      return;
    }

    if(persistentObjects){
      this._client = persistentObjects.client;
      this._client.Dispatcher.removeAllListeners('GATEWAY_READY');
      this._client.Dispatcher.removeAllListeners('GATEWAY_RESUMED');
      this._client.Dispatcher.removeAllListeners('MESSAGE_CREATE');
      this._client.Dispatcher.removeAllListeners('DISCONNECTED');
      this._connected = true;
      //if client state is DISCONNECTED for some reason, we should try to reconnect now.
      if(this._client.state === 'DISCONNECTED') {
        this.connect();
      }
    } else {
      this._client = new Discordie();
    }

    this._client.Dispatcher.on('GATEWAY_READY', () => {
      GLOBAL.logger.silly(`${self._pluginName}|${self._id}: Connected as ${this._client.User.username}.`);
      //set game status if configured.
      if(this._config.game) {
        this._client.User.setStatus('idle', {name: `${this._config.game}.`});
      }
    });

    this._client.Dispatcher.on('GATEWAY_RESUMED', () => {
      GLOBAL.logger.silly(`${self._pluginName}|${self._id}: Reconnected as ${this._client.User.username}.`);
      //set game status if configured.
      if(this._config.game) {
        this._client.User.setStatus('idle', {name: `${this._config.game}.`});
      }
    });

    this._client.Dispatcher.on('MESSAGE_CREATE', e => {
      self._AKP48.onMessage(e.message.content, self.createContextFromMessage(e));
    });

    this._client.Dispatcher.on('DISCONNECTED', (err) => {
      GLOBAL.logger.silly(`${self._pluginName}|${self._id}: Disconnected from server. Error message: "${err.message}."`);
      self.connect(); // if we get disconnected, try to reconnect. This event won't fire when we purposely disconnect, so this is fine.
    });

    this._AKP48.on('msg_'+this._id, function(to, message, context) {
      if(!context.noPrefix) {message = `${context.rawMessage.author.mention}: ${message}`;}

      message = c.stripColorsAndStyle(message);

      // if we're configured to send a "typing" message first, send it, otherwise just send the message.
      if(self._config.typingTimeout) {
        context.rawMessage.channel.sendTyping();
        setTimeout(function(){
          context.rawMessage.channel.sendMessage(message);
          self._AKP48.sentMessage(to, message, context);
        }, self._config.typingTimeout * 1000);
      } else {
        context.rawMessage.channel.sendMessage(message);
        self._AKP48.sentMessage(to, message, context);
      }
    });
  }

  connect() {
    if(this._error) {
      GLOBAL.logger.error(`${this._pluginName}|${this._id}: Cannot connect. Check log for errors.`);
      return;
    }
    if(this._connected) {
      GLOBAL.logger.silly(`${this._pluginName}|${this._id}: Reusing previous connection.`);
      this._connected = false;
      return;
    } else {
      GLOBAL.logger.silly(`${this._pluginName}|${this._id}: Connecting...`);
      this._client.connect({token: this._config.token});
    }
  }

  disconnect() {
    if(this._error) {
      GLOBAL.logger.error(`${this._pluginName}|${this._id}: Cannot disconnect. Check log for errors.`);
      return;
    }
    GLOBAL.logger.silly(`${this._pluginName}|${this._id}: Disconnecting.`);
    this._client.disconnect();
  }
}

Discord.prototype.createContextFromMessage = function (msg) {
  //check to be sure we didn't send the message.
  if(msg.socket.userId === msg.message.author.id) {
    return;
  }

  var text = msg.message.content;

  var delimiterLength = this.isTextACommand(text, msg.message.channel_id);
  if(delimiterLength) {
    text = text.slice(delimiterLength).trim();
  }

  return {
    rawMessage: msg.message,
    nick: msg.message.author.username,
    user: msg.message.author.id,
    text: text,
    to: msg.message.channel_id,
    myNick: this._client.User.username,
    instanceId: this._id,
    instanceType: 'discord',
    instance: this,
    isCmd: (delimiterLength ? true : false)
  };
};

Discord.prototype.getChannelConfig = function (channel) {
  if(!this._config.chanConfig) {return {};}
  return this._config.chanConfig[channel] || {};
};

//TODO: Support for @mentions.
Discord.prototype.isTextACommand = function (text, channel) {
  var delimit = this.getChannelConfig(channel).commandDelimiters || this._config.commandDelimiters || this._defaultCommandDelimiters;
  for (var i = 0; i < delimit.length; i++) {
    if(text.startsWith(delimit[i])) {
      return delimit[i].length;
    }
  }

  return false;
};

Discord.prototype.getPersistentObjects = function () {
  return {
    client: this._client
  };
};

module.exports = Discord;
