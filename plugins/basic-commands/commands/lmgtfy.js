function LMGTFY() {
  this.names = ['lmgtfy'];
}

LMGTFY.prototype.respond = function (context) {
  var query = encodeURIComponent(context.text);
  if(!query) {return null;}
  return `https://lmgtfy.com/?q=${query}`;
};

module.exports = LMGTFY;
