var parser = require('./parser.js');
var streamer = require('./streamer.js');
var tokenizer = require('./tokenizer.js');
var environment = require('./environment.js');

module.exports = {
    interpret: function (program) {
        var stream = streamer.Stream(program);
        var tokens = tokenizer.Tokenize(stream);
        var ast = parser.parse(tokens);
        var g = new environment.Environment();
        var result = "";
        g.output = (...args) => result += args + "\n";
        g.run(ast);
        return result;
    }
};
