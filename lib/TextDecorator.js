/**
 * This is the default TextDecorator definition. Any TextDecorators
 * should extend this.
 */
function TextDecorator() {}

/**
 * Applies styles to a string.
 * @param  {String} str    The string to apply styles to.
 * @param  {String} styles The style or styles to apply. Space-delimited.
 * @return {String}        The string with styles applied.
 */
TextDecorator.prototype.applyStyle = function (str, ...styles) {
  return str;
};

/**
 * Removes all styles from a string.
 * @param  {String} str    The string to remove styles from.
 * @return {String}        The string with styles removed.
 */
TextDecorator.prototype.removeAllStyles = function (str) {
  return str;
};

module.exports = TextDecorator;
