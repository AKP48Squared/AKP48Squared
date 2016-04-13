'use strict';
const ServerConnectorPlugin = require('../../lib/ServerConnectorPlugin');
const restify = require('restify');
const skype = require('skype-sdk');
var c = require('irc-colors');

class Skype extends ServerConnectorPlugin {
  constructor(config, id, AKP48, persistentObjects) {
    super('Skype', AKP48);
    this._id = id;
    this._config = config;
    if(!config || !config.appId || !config.appSecret) {
      GLOBAL.logger.error(`${this._pluginName}: Required appId and/or appSecret options missing from config!`);
      this._error = true;
      return;
    }
    var self = this;
    this._defaultCommandDelimiters = ['!', '.'];
    if(persistentObjects) {
      this._botService = persistentObjects.botService;
      this._botService.removeAllListeners('contactAdded');
      this._botService.removeAllListeners('personalMessage');
      this._botService.removeAllListeners('groupMessage');
      this._connected = true;
    } else {
      this._botService = new skype.BotService({
        messaging: {
          botId: '28:'+config.appId,
          serverUrl : 'https://apis.skype.com',
          requestTimeout : 15000,
          appId: config.appId,
          appSecret: config.appSecret
        }
      });
    }

    this._botService.on('contactAdded', (bot, data) => {
      bot.reply(`Hello, ${data.fromDisplayName}! For help, say "!help".`, true);
    });

    this._botService.on('personalMessage', (bot, data) => {
      self._AKP48.onMessage(data.content, self.createContextFromMessage(bot, data));
    });

    this._botService.on('groupMessage', (bot, data) => {
      self._AKP48.onMessage(data.content, self.createContextFromMessage(bot, data));
    });

    if(persistentObjects) {
      this._server = persistentObjects.server;
    } else {
      this._server = restify.createServer();
    }

    //this._server.use(skype.ensureHttps(true));
    this._server.use(skype.verifySkypeCert());
    this._server.post('/v1/chat', skype.messagingHandler(this._botService));
    this._port = config.port || 9658;

    this._AKP48.on('msg_'+this._id, function(to, message, context) {
      message = c.stripColorsAndStyle(message);
      context.bot.reply(message);
      self._AKP48.sentMessage(to, message, context);
    });
  }

  connect() {
    if(this._error) {
      GLOBAL.logger.error(`${this._pluginName}|${this._id}: Cannot connect. Check log for errors.`);
      return;
    }
    if(this._connected) {
      GLOBAL.logger.debug(`${this._pluginName}|${this._id}: Using previous server.`);
      this._connected = false;
    } else {
      this._server.listen(this._port);
      GLOBAL.logger.debug(`${this._pluginName}|${this._id}: Server listening for incoming requests on port ${this._port}.`);
    }
  }

  disconnect() {
    if(this._error) {
      GLOBAL.logger.error(`${this._pluginName}|${this._id}: Cannot connect. Check log for errors.`);
      return;
    }
    this._server.close();
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

Skype.prototype.getPersistentObjects = function () {
  return {
    botService: this._botService,
    server: this._server
  };
};

module.exports = Skype;
