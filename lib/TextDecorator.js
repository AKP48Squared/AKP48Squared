'use strict';
/**
 * This is the default TextDecorator definition. Any TextDecorators
 * should extend this.
 */
class TextDecorator {
  constructor() {}

  /**
   * Parses a message and applies the proper styles to it.
   * @param  {Object} msg The message that we'll be applying styles to.
   * @return {String}     The string to output to clients.
   */
  parse(msg) {
    if(typeof msg === 'string') {
      return msg; // we don't process strings.
    };

    if(msg.length) { // Probably an array.
      var out = '';
      for (var i = 0; i < msg.length; i++) {
        if(typeof msg[i] !== 'object' || !msg[i].text) {
          out += msg[i];
        } else {
          var s = msg[i].style;
          var t = msg[i].text;
          out += this.applyStyle(t, s);
        }
      }
      return out;
    }

    //this should be an object if we made it here.
    return this.applyStyle(msg.text, msg.style);
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
