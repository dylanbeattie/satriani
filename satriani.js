const parser = require('./parser.js');
const streamer = require('./streamer.js');
const tokenizer = require('./tokenizer.js');
const environment = require('./environment.js');

module.exports = {
    Interpreter : function(output) {
        this.output = output;
        this.interpret = function (program) {
            let stream = streamer.Stream(program);
            let tokens = tokenizer.Tokenize(stream);
            let ast = parser.Parse(tokens);
            let g = new environment.Environment();
            g.output = output;
            g.run(ast);
        }
        this.parse = function(program) {
            let stream = streamer.Stream(program);
            let tokens = tokenizer.Tokenize(stream);
            let ast = parser.Parse(tokens);
            return(ast);
        }
    }
};
