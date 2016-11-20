/**
 * This is the default TextDecorator definition. Any TextDecorators
 * should extend this.
 */
class TextDecorator {
  constructor() {

  }

  /**
   * Parses a message and applies the proper styles to it.
   * @param  {Object} msg The message that we'll be applying styles to.
   * @return {String}     The string to output to clients.
   */
  parse(msg) {
    return msg; //TODO: actually process this.
  }

  /**
   * Applies styles to a string.
   * @param  {String} str    The string to apply styles to.
   * @param  {String} styles The style or styles to apply. Space-delimited.
   * @return {String}        The string with styles applied.
   */
  applyStyle(str, ...styles) {
    return str; // NOOP, designed to be overridden.
  }

  /**
   * Removes all styles from a string.
   * @param  {String} str    The string to remove styles from.
   * @return {String}        The string with styles removed.
   */
  removeAllStyles(str) {
    return str; // NOOP, designed to be overridden.
  }
}

module.exports = TextDecorator;
