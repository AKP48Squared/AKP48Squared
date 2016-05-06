'use strict';
var path = require('path');
var shell = require('shelljs');
var depends = require(path.resolve(require('app-root-path').path, 'package.json')).dependencies;
var deps = [];

for (let dep in depends) {
  if(dep.startsWith('akp48-plugin-')) {
    deps.push(dep);
  }
}

console.log(`Executing 'npm install --save ${deps.join(' ')}'`);
shell.exec(`npm install --save ${deps.join(' ')}`);
