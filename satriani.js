var parser = require('./parser.js');
var streamer = require('./inputstream.js');
var tokenizer = require('./tokenizer.js');
var environment = require('./environment.js');

module.exports = {
    interpret: function (program) {
        var stream = streamer.InputStream(program);
        var tokens = tokenizer.Tokenize(stream);
        var ast = parser.parse(tokens);
        var g = new environment.Environment();
        g.run(ast);
    }
};
