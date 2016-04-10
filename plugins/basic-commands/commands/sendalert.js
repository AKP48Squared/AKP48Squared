function SendAlert() {
  this.names = ['sendalert'];
}

SendAlert.prototype.respond = function (context) {
  context.isAlert = true;
  return context.text || null;
};

module.exports = SendAlert;
