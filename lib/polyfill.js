//jshint ignore:start
module.exports = function() {
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
      'use strict';
      var O = Object(this);
      var len = parseInt(O.length) || 0;
      if (len === 0) {
        return false;
      }
      var n = parseInt(arguments[1]) || 0;
      var k;
      if (n >= 0) {
        k = n;
      } else {
        k = len + n;
        if (k < 0) {k = 0;}
      }
      var currentElement;
      while (k < len) {
        currentElement = O[k];
        if (searchElement === currentElement ||
           (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
          return true;
        }
        k++;
      }
      return false;
    };
  }

  if (!String.prototype.pluralize) {
    String.prototype.pluralize = function(count, plural) {
      if (plural == null)
        plural = this + 's';

      return (count == 1 ? this : plural)
    }
  }

  // if (!Object.prototype.some) {
  //   // Return true to stop looping
  //   Object.prototype.some = function(callback, thisArg) {
  //     'use strict';
  //     if (this == null) throw new TypeError('Object.prototype.some called on null or undefined');
  //     if (typeof callback !== 'function') throw new TypeError();
  //     thisArg = thisArg || void 0;
  //     return Object.keys(this).some(function (key, id, array) {
  //       return callback.call(thisArg, this[key], key, this);
  //     }, this);
  //   };
  // }
}();
