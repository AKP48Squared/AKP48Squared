'use strict';
const ServerConnectorPlugin = require('../../lib/ServerConnectorPlugin');
const AKP48 = GLOBAL.AKP48 || null;
const irc = require('irc');
const uuid = require('node-uuid');

class IRC extends ServerConnectorPlugin {
  constructor(config) {
    super('IRC', AKP48);
    this._id = uuid.v4();
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
      self._AKP48.onMessage(self.createContextFromMessage(message, to));
    });

    this._AKP48.on('msg_'+this._id, function(to, message) {
      self._client.say(to, message);
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
  return {
    rawMessage: message,
    nick: message.nick,
    user: message.prefix,
    text: message.args[1],
    to: to,
    instanceId: this._id
  };
};

module.exports = IRC;
