const rockstar = require('./rockstar.js');
const environment = require('./environment.js');

module.exports = {
    Interpreter : function(output) {
        this.output = output;
        this.interpret = function (program) {
            let ast = this.parse(program);
            let g = new environment.Environment();
            g.output = output;
            return g.run(ast);
        }
        this.parse = function(program) {
            let ast = rockstar.parse(program);
            return(ast);
        }
    }
};
