const glob = require('glob');
const Promise = require('bluebird'); // jshint ignore:line
const path = require('path');

module.exports = function() {
  return new Promise(function(resolve, reject) {
    var modules = {};
    glob(path.join(__dirname, '*.js'), function(err, files) {
      if(err){reject(err); return;}
      for (var i = 0; i < files.length; i++) {
        var filename = path.basename(files[i]);
        if(filename !== 'index.js') {
          var mod = require(files[i]);
          var loadMod = new mod(); // jshint ignore:line
          modules[filename] = loadMod;
        }
      }
      resolve(modules);
    });
  });
}();
