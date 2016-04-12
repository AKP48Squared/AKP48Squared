function GetChar() {
  this.names = ['getchar', 'getcharacter'];
}

GetChar.prototype.respond = function (context) {
  var args = context.text.split(' ');
  if(!args.length) {return null;}

  var out = '';

  for (var i = 0; i < args.length; i++) {
    out += `${String.fromCharCode(args[i])} `;
  }
  return out;
};

module.exports = GetChar;
