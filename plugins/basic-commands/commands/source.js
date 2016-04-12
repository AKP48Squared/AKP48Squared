function Source() {
  this.names = ['source', 'src', 'repo'];
}

Source.prototype.respond = function () {
  return 'https://github.com/AKPWebDesign/AKP48Squared';
};

module.exports = Source;
