function Credits() {
  this.names = ['credits', 'ghcredits'];
}

Credits.prototype.respond = function () {
  return `https://github.com/AKP48Squared/AKP48Squared/blob/master/CREDITS.md`;
};

module.exports = Credits;
