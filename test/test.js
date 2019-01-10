var expect = require('chai').expect;
var assert = require('chai').assert;

var path = require('path');

const fs = require('fs');
var satriani = require('../satriani.js');

describe('feature tests', function() {
    var fixtures = fs.readdirSync('test/fixtures');
    fixtures.forEach(fixture => {
        test_directory(path.join('test/fixtures/', fixture));
    });
});
;
function execute(source) {
    let result = "";
    let interpreter = new satriani.Interpreter(function(...args) {
        result += args + "\n";
    });
    interpreter.interpret(source);
    return result;

}

function test_directory(directory) {
    describe(directory, function () {
        var files = fs.readdirSync(directory);
        files.forEach(file => {
            if (! /\.rock$/.test(file)) return;;
            it(file, function() {
                let source = fs.readFileSync(path.join(directory, file), 'utf8');
                let target = fs.readFileSync(path.join(directory, file)+'.out', 'utf8');
                let actual = execute(source);
                assert.equal(target,actual);
            });
            console.log(file);
        });
    });
}
