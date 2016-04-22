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
    if(!config.keyLoc || !config.certLoc) {
      GLOBAL.logger.error(`${this._pluginName}: No certificate and/or key found! Cannot start Skype plugin.`);
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
      self._AKP48.onMessage(data.content, self.createContextsFromMessage(bot, data));
    });

    this._botService.on('groupMessage', (bot, data) => {
      self._AKP48.onMessage(data.content, self.createContextsFromMessage(bot, data));
    });

    this._server = restify.createServer({
      key: require('fs').readFileSync(config.keyLoc),
      cert: require('fs').readFileSync(config.certLoc)
    });

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

Skype.prototype.createContextsFromMessage = function (bot, data) {
  var textArray = data.content.split(/[^\\]\|/);
  var ctxs = [];

  for (var i = 0; i < textArray.length; i++) {
    textArray[i] = textArray[i].trim();
    var delimiterLength = this.isTextACommand(textArray[i]);
    if(delimiterLength) {
      textArray[i] = textArray[i].slice(delimiterLength).trim();
    }

    var ctx = {
      rawMessage: data,
      nick: data.from,
      user: data.from,
      rawText: data.content,
      text: textArray[i].trim(),
      to: data.to,
      myNick: '28:'+this._config.appId,
      bot: bot,
      instanceId: this._id,
      instanceType: 'skype',
      instance: this,
      isCmd: delimiterLength ? true : false
    };

    ctxs.push(ctx);
  }

  ctxs[ctxs.length-1].last = true;

  return ctxs;
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
    botService: this._botService
  };
};

module.exports = Skype;
