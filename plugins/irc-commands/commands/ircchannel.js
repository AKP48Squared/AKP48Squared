function IRCChannel() {
  this.names = ['chan', 'join', '+', 'part', '-'];
}

IRCChannel.prototype.respond = function (context) {
  var IRC = context.instance;
  var chans = [];
  
  // verify each chan is actually a channel
  for (var chan in context.text.split(" ")) {
    if (chan.match(/([#&][^\x07\x2C\s]{0,200})/)) {
      chans.push(chan);
    }
  }
  
  switch(context.command) {
    default:
    case "chan":
      // Usage, for now. Later perhaps allow +/-channel
      return "(join|part) channel [channel...]";
    case "join":
    case "+":
      // Joining
      chans.forEach(function (c) {
        if(IRC._config.channels.includes(c)) { // Don't join channels we're already part of
          continue;
        }
        IRC._client.join(c, function() {
          if(!IRC._config.channels.includes(c)) {
            IRC._config.channels.push(c);
            IRC._AKP48.saveConfig(IRC._config, IRC._id, true);
          }
          var joinMsg = `Hello, everyone! I'm AKP48! I respond to commands and generally try to be helpful. For more information, say ".help"!`;
          IRC._client.say(channel, joinMsg);
          IRC._AKP48.sentMessage(channel, joinMsg, {myNick: IRC._client.nick, instanceId: IRC._id});
        });
      });
      break;
    case "part":
    case "-":
      // Leaving
      chans.forEach(function (c) {
        if(!IRC._config.channels.includes(c)) { // Don't leave channels we're not part of
          continue;
        }
        IRC._client.part(c, function() {
          if(IRC._config.channels.includes(c)) {
            IRC._config.channels.split(IRC._config.channels.indexOf(c), 1);
            IRC._AKP48.saveConfig(IRC._config, IRC._id, true);
          }
        });
      });
      break;
  }
  return null;
};

module.exports = IRCChannel;
