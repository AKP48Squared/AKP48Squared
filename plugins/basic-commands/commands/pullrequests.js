function PullRequests() {
  this.names = ['pr', 'prs', 'pulls', 'ghpulls', 'ghpr', 'ghprs'];
}

PullRequests.prototype.respond = function () {
  return 'https://github.com/AKPWebDesign/AKP48Squared/pulls';
};

module.exports = PullRequests;
