//jshint ignore:start
module.exports = function() {
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

  String.prototype.pluralize = function(count, plural) {
    if (plural == null)
      plural = this + 's';

    return (count == 1 ? this : plural)
  };

  global.destroy = function(thisObj) {
    for (var k in thisObj) {
      thisObj[k] = null;
      delete thisObj[k];
    }
    thisObj.__proto__ = null;
    delete thisObj.__proto__;
    thisObj = null;
  };

  global.reallyDestroy = function(thisObj) {
    for (var key in thisObj) {
      if(typeof thisObj[key] === 'object') {
        try {
          global.reallyDestroy(thisObj[key]);
        } catch (e) {
          try {
            global.destroy(thisObj[key]);
          } catch (e) {
            console.log(e);
            //we give up now.
          }
        }
      } else {
        thisObj[key] = null;
        delete thisObj[key];
      }
    }

    thisObj = null;
  };
}();
