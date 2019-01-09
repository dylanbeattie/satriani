const fs = require('fs');
const Satriani = require('./satriani.js');

var sourceFilePath = process.argv[2];
fs.readFile(sourceFilePath, 'utf8', (err, data) => {
    if (err) throw err;
    var stdout = Satriani.interpret(data);
    console.log('----------------------------');
    console.log(stdout);
});

// console.log(1,2,3,4,5);
// console.log("foo", "bar", ["baz", "bam"]);
