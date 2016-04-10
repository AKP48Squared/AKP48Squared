function DOTAFreeHeroes() {
  this.names = ['dotafreeheroes', 'dotafree', 'dota2freeheroes', 'dota2free',
                'paragonfreeheroes', 'paragonfree', 'dotafh', 'dota2fh', 'paragonfh'];
}

DOTAFreeHeroes.prototype.respond = function () {
  return 'All of them.';
};

module.exports = DOTAFreeHeroes;
