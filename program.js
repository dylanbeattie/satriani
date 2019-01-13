const fs = require('fs');
const Satriani = require('./satriani.js');

let data = process.argv[2];
//fs.readFile(sourceFilePath, 'utf8', (err, data) => {
//    data = "B C D E F is 9";
    // if (err) throw err;
    var interpreter = new Satriani.Interpreter(console.log);
    var output = interpreter.tokenize(data);
    // var ast = interpreter.parse(data);
    console.log(JSON.stringify(output, null, 2));

    //interpreter.interpret(data);
// });