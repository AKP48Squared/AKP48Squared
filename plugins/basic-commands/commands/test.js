function Test() {
  this.names = ['test'];
}

Test.prototype.respond = function (context) {
  return 'Test! ' + context.instanceId;
};

module.exports = Test;
