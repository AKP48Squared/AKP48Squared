function Issues() {
  this.names = ['bugs', 'ghissues'];
}

Issues.prototype.respond = function () {
  return 'https://github.com/AKPWebDesign/AKP48Squared/issues';
};

module.exports = Issues;
