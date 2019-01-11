const parser = require('../parser.js');
const streamer = require('../streamer.js');
const tokenizer = require('../tokenizer.js');
const assert = require('chai').assert;

function parse(source) {
    let stream = streamer.Stream(source);
    let tokens = tokenizer.Tokenize(stream);
    let ast = parser.Parse(tokens);
    return ast.prog;
}

describe('parser', function() {
    it('parses comments', function() {
        let prog = parse('(this is a comment)');
        assert.equal(prog.length, 0);
    });
    var variables = [
        ['a variable', 'a_variable'],
        ['The VARIABLE', 'the_variable'],
        ['an variable', 'an_variable'],
        ['MY VARIABLE', 'my_variable'],
        ['YOUR variABLE', 'your_variable']
    ];
    for(let key in variables) {
        console.log(key);
        console.log(variables[key][1]);
        it('parses common variable \'' + variables[key][0] + '\'', function () {
            let prog = parse(variables[key][0]);
            assert.equal(prog[0].type, 'var');
            assert.equal(prog[0].value, variables[key][1]);
        })
    }
});
