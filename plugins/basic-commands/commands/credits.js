function Credits() {
  this.names = ['credits', 'ghcredits'];
}

Credits.prototype.respond = function () {
  return `https://github.com/AKPWebDesign/AKP48Squared/blob/master/CREDITS.md`;
};

module.exports = Credits;
