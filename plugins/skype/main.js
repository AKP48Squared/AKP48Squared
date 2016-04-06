'use strict';
const ServerConnectorPlugin = require('../../lib/ServerConnectorPlugin');
const restify = require('restify');
const skype = require('skype-sdk');

class Skype extends ServerConnectorPlugin {
  constructor(config, id, AKP48) {
    super('Skype', AKP48);
    this._id = id;
    this._config = config;
    if(!config || !config.appId || !config.appSecret) {
      GLOBAL.logger.error('Required options missing from config!');
      return;
    }
    this._defaultCommandDelimiters = ['!', '.'];
    this._botService = new skype.BotService({
      messaging: {
        botId: '28:<bot’s id="">',
        serverUrl : 'https://apis.skype.com',
        requestTimeout : 15000,
        appId: config.appId,
        appSecret: config.appSecret
      }
    });

    this._botService.on('contactAdded', (bot, data) => {
        bot.reply(`Hello ${data.fromDisplayName}!`, true);
    });

    this._botService.on('personalMessage', (bot, data) => {
        bot.reply(`Hey ${data.from}. Thank you for your message: "${data.content}".`, true);
    });

    this._server = restify.createServer();
    this._server.post('/v1/chat', skype.messagingHandler(this._botService));
    this._port = config.port || 9658;
    this._server.listen(this._port);
    GLOBAL.logger.info('Skype server listening for incoming requests on port ' + this._port);
  }

  connect() {
    GLOBAL.logger.debug('Skype is always connected; dropping request.');
  }

  disconnect() {
    GLOBAL.logger.debug('Skype cannot be disconnected; dropping request.');
  }
}

Skype.prototype.createContextFromMessage = function (message, to) {
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
    instanceType: 'skype',
    instance: this,
    isCmd: (delimiterLength ? true : false)
  };
};

Skype.prototype.getChannelConfig = function (channel) {
  return this._config.chanConfig[channel] || {};
};

Skype.prototype.isTextACommand = function (text, channel) {
  var delimit = this.getChannelConfig(channel).commandDelimiters || this._config.commandDelimiters || this._defaultCommandDelimiters;
  for (var i = 0; i < delimit.length; i++) {
    if(text.startsWith(delimit[i])) {
      return delimit[i].length;
    }
  }

  return false;
};

module.exports = Skype;
