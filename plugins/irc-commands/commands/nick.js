function Nick() {
  this.names = ['nick'];
}

//TODO: Verify that nick is valid before attempting to set.
Nick.prototype.respond = function (context) {
  if(context.text) {
    context.instance._client.send('NICK', context.text);

    //save IRC config
    var conf = context.instance._config;
    conf.nick = context.text;
    context.instance._client.opt.nick = context.text;

    global.AKP48.saveConfig(conf, context.instanceId, true);
  }

  return null;
};

module.exports = Nick;
