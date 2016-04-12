var chance = new (require('chance'))();
var n = require('numeral');

function Roll() {
  this.names = ['roll'];
}

Roll.prototype.respond = function (context) {
  var diceRegEx = /^^(?:roll(?= *[^+ ]))(?: *(?: |\+) *(?:\d*[1-9]\d*|(?=d))(?:d\d*[1-9]\d*(?:x\d*[1-9]\d*)?)?)+ *$/gi;
  var diceRollRegEx = /[ +](\d+|(?=d))(?:d(\d+)(?:x(\d+))?)?(?= *(\+| |$))/gi;
  //TODO: figure out how to remove 'roll' from the regex.
  var msg = `roll ${context.text}`;
  var result, di;
  var dice = [];

  var countLimited = false;


  //for each group
  while((di = diceRegEx.exec(msg)) !== null) {
    //for each dice
    while((result = diceRollRegEx.exec(di)) !== null) {
      //parse out each value
      var count = (parseInt(result[1]) !== 0) ? parseInt(result[1]) : 1;
      if(isNaN(count)) {count = 1;}
      if(count > 1000) {count = 1000; countLimited = true;}

      var maxValue = (parseInt(result[2]) !== 0) ? parseInt(result[2]) : 1;
      if(isNaN(maxValue)) {maxValue = 1;}
      if(maxValue > 300) {maxValue = 300; countLimited = true;}

      var multiplier = (parseInt(result[3]) !== 0) ? parseInt(result[3]) : 1;
      if(isNaN(multiplier)) {multiplier = 1;}

      var isFinalValue = !('+' === result[4]); // jshint ignore:line

      //add to array
      dice.push({
        count: count,
        maxValue: maxValue,
        multiplier: multiplier,
        isFinalValue: isFinalValue
      });
    }
  }

  var rolls = [];
  var roll = 0;

  //for each di
  for (var i = 0; i < dice.length; i++) {
    //for count of di
    for(var j = 0; j < dice[i].count; j++) {
      //add dice result to roll.
      roll += chance.natural({min: 1, max: dice[i].maxValue}) * dice[i].multiplier;
    }

    //if this was the last di in this group
    if(dice[i].isFinalValue) {
      //push & reset the roll
      rolls.push(roll);
      roll = 0;
    }
  }

  var out = '';

  //format output
  for (var k = 0; k < rolls.length; k++) {
    out += `${n(rolls[k]).format('0,0')} · `;
  }

  out = out.substring(0, out.length-3);

  if(countLimited) {out += ' | (Dice counts limited to 1,000. Dice sides limited to 300)';}

  return out;
};

module.exports = Roll;
