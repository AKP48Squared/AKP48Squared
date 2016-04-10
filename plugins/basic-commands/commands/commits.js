function Commits() {
  this.names = ['commits', 'ghcommits'];
}

Commits.prototype.respond = function () {
  return `https://github.com/AKPWebDesign/AKP48Squared/commits`;
};

module.exports = Commits;
