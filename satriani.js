var parser = require('./parser.js');
var streamer = require('./streamer.js');
var tokenizer = require('./tokenizer.js');
var environment = require('./environment.js');

module.exports = {
    Interpreter : function(output) {
        this.output = output;
        this.interpret = function (program) {
            let stream = streamer.Stream(program);
            let tokens = tokenizer.Tokenize(stream);
            let ast = parser.parse(tokens);
            let g = new environment.Environment();
            g.output = output;
            g.run(ast);
        }
    }
};
