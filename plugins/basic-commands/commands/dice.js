function Dice() {
  this.names = ['dice'];
}

Dice.prototype.respond = function (context) {
  var args = context.text.split(' ');

  var numRolls, numSides;

  if(args[0] === undefined) {
    numRolls = 1;
  } else {
    numRolls = parseInt(args[0]);
    if(isNaN(numRolls)) {numRolls = 1;}
  }

  if(args[1] === undefined) {
    numSides = 6;
  } else {
    numSides = parseInt(args[1]);
    if(isNaN(numSides)) {numSides = 6;}
  }

  //TODO: Make this configurable?
  if(numSides > 500) {numSides = 500;}
  if(numRolls > 50) {numRolls = 50;}

  if(numSides < 2) {
      return `ಠ_ಠ`;
  }

  var rolls = [];

  for (var i = 0; i < numRolls; i++) {
    rolls.push(Math.floor(Math.random() * (numSides)) + 1);
  }

  var outputString = '';

  for (var j = 0; j < rolls.length; j++) {
    outputString += `${rolls[j]} · `;
  }

  outputString = outputString.substring(0, outputString.length - 3);

  if(numSides === 2) {
    outputString = outputString.replace(/1/g, 'H');
    outputString = outputString.replace(/2/g, 'T');
  }

  return outputString;
};

module.exports = Dice;
