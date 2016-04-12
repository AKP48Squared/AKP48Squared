function HowsItFeel() {
  this.names = ['howsitfeel', 'howsitfeel?', 'how\'sitfeel', 'how\'sitfeel?'];
}

HowsItFeel.prototype.respond = function () {
  return 'Feels bad, man.';
};

module.exports = HowsItFeel;
