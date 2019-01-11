const fs = require('fs');
const Satriani = require('./satriani.js');

var sourceFilePath = process.argv[2];
fs.readFile(sourceFilePath, 'utf8', (err, data) => {
    if (err) throw err;
    var interpreter = new Satriani.Interpreter(console.log);
    var ast = interpreter.parse(data);
    console.log(JSON.stringify(ast, null, 2));

    interpreter.interpret(data);
});