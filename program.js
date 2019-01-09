const fs = require('fs');
const Satriani = require('./satriani.js');

var sourceFilePath = process.argv[2];
fs.readFile(sourceFilePath, 'utf8', (err, data) => {
    if (err) throw err;
    Satriani.interpret(data);
});