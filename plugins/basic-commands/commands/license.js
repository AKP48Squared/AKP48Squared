function License() {
  this.names = ['license', 'mit'];
}

License.prototype.respond = function () {
  return 'https://github.com/AKP48Squared/AKP48Squared/blob/master/LICENSE';
};

module.exports = License;
