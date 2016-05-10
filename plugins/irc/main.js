'use strict';
const ServerConnectorPlugin = require('../../lib/ServerConnectorPlugin');
const irc = require('irc');
const Promise = require('bluebird'); // jshint ignore:line

class IRC extends ServerConnectorPlugin {
  constructor(config, id, AKP48, persistentObjects) {
    super('IRC', AKP48);
    this._id = id;
    this._config = config;
    this._defaultCommandDelimiters = ['!', '.'];
    var self = this;
    if(!config || !config.server || !config.nick) {
      global.logger.error(`${self._pluginName}|${self._id}: Required server and/or nick options missing from config!`);
      this._error = true;
      return;
    }

    if(persistentObjects) {
      this._client = persistentObjects.client;
      this._client.removeAllListeners('message');
      this._client.removeAllListeners('registered');
      this._client.removeAllListeners('invite');
      this._client.removeAllListeners('kick');
      this._client.removeAllListeners('error');
      this._client.removeAllListeners('action');
      this._client.removeAllListeners('join');
      this._client.removeAllListeners('part');
      this._connected = true;
    } else {
      this._client = new irc.Client(config.server, config.nick, {
        autoRejoin: false,
        autoConnect: false,
        port: config.port || 6667,
        userName: config.userName || 'AKP48',
        realName: config.realName || 'AKP48',
        channels: config.channels || []
      });
    }

    this._client.on('nick', (oldNick, newNick) => {
      global.logger.stupid(`${self._pluginName}|${self._id}: Caught nick change event. "${oldNick}" => "${newNick}"`);
      self._AKP48.emit('nick', oldNick, newNick, self);
    });

    this._client.on('message', function(nick, to, text, message) {
      if(to === config.nick) { to = nick; }
      self._AKP48.onMessage(text, self.createContextsFromMessage(message, to));
    });

    this._client.on('action', function(nick, to, text, message) {
      if(to === config.nick) { to = nick; }
      var context = self.createContextsFromMessage(message, to);
      context.isAction = true;
      self._AKP48.onMessage(text, context);
    });

    this._client.on('registered', function() {
      global.logger.verbose(`${self._pluginName}|${self._id}: Connected to ${self._config.server}.`);
      self._AKP48.emit('registeredOnServer', self._id, self);
    });

    this._client.on('join', function(chan, nick) {
      if(nick === self._client.nick) { return; }
      global.logger.stupid(`${self._pluginName}|${self._id}: Caught join event on ${self._config.server}.`);
      self._AKP48.emit('ircJoin', chan, nick, self);
    });

    this._client.on('part', function(chan, nick, reason) {
      if(nick === self._client.nick) { return; }
      global.logger.stupid(`${self._pluginName}|${self._id}: Caught part event on ${self._config.server}.`);
      self._AKP48.emit('ircPart', chan, nick, reason, self);
    });

    this._client.on('invite', function(channel, from) {
      global.logger.debug(`${self._pluginName}|${self._id}: Invite to channel "${channel}" received from ${from}. Joining channel.`);
      self._client.join(channel, function() {
        var joinMsg = `Hello, everyone! I'm ${self._client.nick}! I respond to commands and generally try to be helpful. For more information, say ".help"!`;
        self._client.say(channel, joinMsg);
        self._AKP48.sentMessage(channel, joinMsg, {myNick: self._client.nick, instanceId: self._id});
        self._AKP48.saveConfig(self._config, self._id, true);
      });
    });

    this._client.on('kick', function(channel, nick, by, reason) {
      if(nick === self._client.nick) {
        global.logger.debug(`${self._pluginName}|${self._id}: Kicked from ${channel} by ${by} for "${reason}". Removing channel from config.`);
        var index = self._config.channels.indexOf(channel);
        while(index > -1) {
          self._config.channels.splice(index, 1);
          index = self._config.channels.indexOf(channel);
        }
        self._AKP48.saveConfig(self._config, self._id, true);
      }
    });

    this._client.on('error', function(message) {
      global.logger.error(`${self._pluginName}|${self._id}: Error received from ${message.server}! ${message.command}: ${message.args}`);
    });

    this._AKP48.on('msg_'+this._id, function(to, message, context) {
      if(!context.noPrefix) {message = `${context.nick}: ${message}`;}
      try {
        self._client.say(to, message);
        self._AKP48.sentMessage(to, message, context);
      } catch (e) {
        global.logger.error(`${self._pluginName}|${self._id}: Error sending message to channel '${to}'! ${e.name}: ${e.message}`);
      }
    });

    this._AKP48.on('emote_'+this._id, function(to, message, context) {
      try {
        self._client.action(to, message);
        self._AKP48.sentMessage(to, message, context);
      } catch (e) {
        global.logger.error(`${self._pluginName}|${self._id}: Error sending action to channel '${to}'! ${e.name}: ${e.message}`);
      }
    });

    this._AKP48.on('alert', function(message) {
      for (var i = 0; i < self._config.channels.length; i++) {
        var chan = self._config.channels[i];
        if(self._config.chanConfig && self._config.chanConfig[chan]) {
          if(self._config.chanConfig[chan].alert) {
            try {
              self._client.say(chan, message);
              self._AKP48.sentMessage(chan, message, {instanceId: self._id, myNick: self._client.nick});
            } catch (e) {
              global.logger.error(`${self._pluginName}|${self._id}: Error sending alert to channel '${chan}'! ${e.name}: ${e.message}`);
            }
          }
        }
      }
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
    this._AKP48.emit('serverConnect', this._id, this);
  }

  disconnect(msg) {
    if(this._error) {
      global.logger.error(`${this._pluginName}|${this._id}: Cannot disconnect. Check log for errors.`);
      return;
    }
    this._client.disconnect(msg || 'Goodbye.');
  }
}

IRC.prototype.createContextsFromMessage = function (message, to) {
  var textArray = message.args[1].split(/[^\\]\|/);
  var ctxs = [];
  var perms = this.getPermissions(`${message.user}@${message.host}`, message.nick, to);

  for (var i = 0; i < textArray.length; i++) {
    textArray[i] = textArray[i].trim();
    var delimiterLength = this.isTextACommand(textArray[i], to);
    if(delimiterLength) {
      textArray[i] = textArray[i].slice(delimiterLength).trim();
    }

    var ctx = {
      rawMessage: message,
      nick: message.nick,
      user: message.prefix,
      permissions: perms,
      rawText: message.args[1],
      text: textArray[i].trim(),
      to: to,
      myNick: this._client.nick,
      instanceId: this._id,
      instanceType: 'irc',
      instance: this,
      isCmd: delimiterLength ? true : false
    };

    // if user is banned, drop request after first context is created.
    if(perms.includes('AKP48.banned')) {
      // emit fullMsg event though, for consumers that want it.
      // (that's why we wait until after the context is created)
      this._AKP48.emit('fullMsg', message.args[1], ctx);
      return;
    }

    ctxs.push(ctx);
  }

  ctxs[ctxs.length-1].last = true;

  return ctxs;
};

IRC.prototype.getChannelConfig = function (channel) {
  if(!this._config.chanConfig) {return {};}
  return this._config.chanConfig[channel] || {};
};

IRC.prototype.isTextACommand = function (text, channel) {
  var delimit = this.getChannelConfig(channel).commandDelimiters || this._config.commandDelimiters || this._defaultCommandDelimiters;
  for (var i = 0; i < delimit.length; i++) {
    if(text.toLowerCase().startsWith(delimit[i].toLowerCase())) {
      return delimit[i].length;
    }
  }

  return false;
};

IRC.prototype.getPermissions = function (prefix, nick, channel) {
  var users = {};
  var configPerms = {};
  var globPerms = {};
  var outputPerms = [];

  if(nick !== channel) {
    users = this._client.chans[channel.toLowerCase()].users;
    configPerms = this.getChannelConfig(channel).users;
    globPerms = this.getChannelConfig('global').users;
  } else {
    configPerms = this.getChannelConfig('global').users;
  }

  if(users && users[nick]) {
    switch(users[nick]) {
      case '~':
        outputPerms.push('irc.channel.owner');
        break;
      case '&':
        outputPerms.push('irc.channel.protected');
        break;
      case '@':
        outputPerms.push('irc.channel.op');
        break;
      case '%':
        outputPerms.push('irc.channel.halfop');
        break;
      case '+':
        outputPerms.push('irc.channel.voice');
        break;
      default:
        break;
    }
  }

  if(configPerms) {
    if(configPerms[prefix]) {
      outputPerms.push.apply(outputPerms, configPerms[prefix]);
    }
  }

  if(globPerms) {
    if(globPerms[prefix]) {
      outputPerms.push.apply(outputPerms, globPerms[prefix]);
    }
  }

  return outputPerms;
};

IRC.prototype.getPersistentObjects = function () {
  return {
    client: this._client
  };
};

module.exports = IRC;
