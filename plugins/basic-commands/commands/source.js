function Source() {
  this.names = ['source', 'src', 'repo', 'link'];
}

Source.prototype.respond = function () {
  return 'https://github.com/AKP48Squared/AKP48Squared/';
};

module.exports = Source;
