const parser = require('./parser.js');
const streamer = require('./streamer.js');
const tokenizer = require('./tokenizer.js');
const environment = require('./environment.js');

module.exports = {
    Interpreter : function(output) {
        this.output = output;
        this.tokenize = function(program) {
            let stream = streamer.Stream(program);
            let tokens = tokenizer.Tokenize(stream);
            let result = [];
            while(! tokens.eof()) result.push(tokens.next());
            return(result);
        }

        this.parse = function(program) {
            let tokens = this.tokenize(stream);
            let ast = parser.Parse(tokens);
            return(ast);
        }

        this.interpret = function (program) {
            let ast = this.parse(program);
            let g = new environment.Environment();
            g.output = output;
            g.run(ast);
        }

    }
};
