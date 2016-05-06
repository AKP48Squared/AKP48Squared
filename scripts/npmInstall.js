const glob = require('glob');
const path = require('path');
const shell = require('shelljs');

shell.exec('npm install');
glob(path.resolve(require('app-root-path').path, 'plugins/*/plugin.json'), function(err, files) {
  if(err) {console.error(`Glob error: "${err}".`);return;}

  for (var i = 0; i < files.length; i++) {
    files[i] = path.dirname(path.resolve(files[i]));
  }

  for (var j = 0; j < files.length; j++) {
    shell.cd(files[j]);
    shell.exec('npm install');
  }
});
