/**
 * This is the default TextDecorator definition. Any TextDecorators
 * should extend this.
 */
function TextDecorator() {

  // These are the colors a TextDecorator is required to support. When extending
  // TextDecorator, you must at least have a function for each of these colors.
  // If you don't, plugins that rely on them may fail. You can define additional
  // colors, but plugins likely will only use the ones specified here. By default,
  // the irc-colors module (https://github.com/fent/irc-colors.js) is compatible
  // with TextDecorator, supporting all of its functions.
  this.colors = [
    'white',
    'black',
    'navy',
    'green',
    'red',
    'brown',
    'purple',
    'olive',
    'yellow',
    'lightgreen',
    'teal',
    'cyan',
    'blue',
    'pink',
    'gray',
    'lightgray',
    'rainbow'
  ];

  // Same as above goes for these styles.
  this.styles = [
    'normal',
    'underline',
    'bold',
    'italic'
  ];

  for (var i = 0; i < this.colors.length; i++) {
    // Foreground colors.
    var fg = (str) => {
      return str; // no-op, designed to be overridden. only here so the default object has the right structure.
    };

    // Background colors.
    var bg = (str) => {
      return str; // no-op, designed to be overridden. only here so the default object has the right structure.
    };

    TextDecorator.prototype[this.colors[i]] = fg;
    TextDecorator.prototype['bg' + this.colors[i]] = bg;
  }

  for (var i = 0; i < this.styles.length; i++) {
    TextDecorator.prototype[this.styles[i]] = (str) => {
      return str; // no-op, designed to be overridden. only here so the default object has the right structure.
    };
  }
}

TextDecorator.prototype.stripColors = function () {
  // no-op, designed to be overridden.
};

TextDecorator.prototype.stripStyle = function () {
  // no-op, designed to be overridden.
};

TextDecorator.prototype.stripColorsAndStyle = function () {
  // no-op, designed to be overridden.
};

module.exports = TextDecorator;
