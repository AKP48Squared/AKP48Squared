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
    var self = this;
    this._defaultCommandDelimiters = ['!', '.'];
    this._botService = new skype.BotService({
      messaging: {
        botId: '28:'+config.appId,
        serverUrl : 'https://apis.skype.com',
        requestTimeout : 15000,
        appId: config.appId,
        appSecret: config.appSecret
      }
    });

    this._botService.on('contactAdded', (bot, data) => {
      bot.reply(`Hello, ${data.fromDisplayName}! For help, say "!help".`, true);
    });

    this._botService.on('userAdded', (bot, data) => {
      if(data.targets.includes('28:'+config.appId)) {
        bot.reply(`Hello everyone! I'm AKP48, a friendly bot, here to respond to commands. For help, say "!help".`);
      }
    });

    this._botService.on('personalMessage', (bot, data) => {
      self._AKP48.onMessage(data.content, self.createContextFromMessage(bot, data));
    });

    this._botService.on('groupMessage', (bot, data) => {
      self._AKP48.onMessage(data.content, self.createContextFromMessage(bot, data));
    });

    this._server = restify.createServer();
    //this._server.use(skype.ensureHttps(true));
    this._server.use(skype.verifySkypeCert());
    this._server.post('/v1/chat', skype.messagingHandler(this._botService));
    this._port = config.port || 9658;
    this._server.listen(this._port);
    GLOBAL.logger.info('Skype server listening for incoming requests on port ' + this._port);

    this._AKP48.on('msg_'+this._id, function(to, message, context) {
      context.bot.reply(message);
      self._AKP48.sentMessage(to, message, context);
    });
  }

  connect() {
    GLOBAL.logger.debug('Skype is always connected; dropping request.');
  }

  disconnect() {
    GLOBAL.logger.debug('Skype cannot be disconnected; dropping request.');
  }
}

Skype.prototype.createContextFromMessage = function (bot, data) {
  var delimiterLength = this.isTextACommand(data.content);
  if(delimiterLength) {
    data.content = data.content.slice(delimiterLength).trim();
  }

  return {
    rawMessage: data,
    nick: data.from,
    user: data.from,
    text: data.content,
    to: data.to,
    myNick: '28:'+this._config.appId,
    bot: bot,
    instanceId: this._id,
    instanceType: 'skype',
    instance: this,
    isCmd: (delimiterLength ? true : false)
  };
};

Skype.prototype.isTextACommand = function (text) {
  var delimit = this._config.commandDelimiters || this._defaultCommandDelimiters;
  for (var i = 0; i < delimit.length; i++) {
    if(text.startsWith(delimit[i])) {
      return delimit[i].length;
    }
  }

  return false;
};

module.exports = Skype;
