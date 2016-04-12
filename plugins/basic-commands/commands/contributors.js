function Contributors() {
  this.names = ['contributors', 'ghcontrib'];
}

Contributors.prototype.respond = function () {
  return `https://github.com/AKPWebDesign/AKP48Squared/graphs/contributors`;
};

module.exports = Contributors;
