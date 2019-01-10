var expect = require('chai').expect;
var assert = require('chai').assert;

var path = require('path');

const fs = require('fs');
var satriani = require('../satriani.js');

describe('failure tests', function() {
    test_directory('test/failures/', execute_and_compare_error);
});

describe('feature tests', function() {
    var fixtures = fs.readdirSync('test/fixtures');
    fixtures.forEach(fixture => {
        test_directory(path.join('test/fixtures/', fixture), execute_and_compare_output);
    });
});

function test_directory(directory, predicate) {
    describe(directory, function () {
        var files = fs.readdirSync(directory);
        files.forEach(file => {
            if (! /\.rock$/.test(file)) return;
            it(file, function() {
                predicate(path.join(directory,file));
            });
        });
    });
}

function execute(source) {
    let result = "";
    let interpreter = new satriani.Interpreter(function(...args) { result += args + "\n"; });
    interpreter.interpret(source);
    return result;
}


function execute_and_compare_output(file) {
    let source = fs.readFileSync(file, 'utf8');
    let targetFile = file + '.out';
    let target = fs.existsSync(targetFile) ? fs.readFileSync(targetFile, 'utf8') : '';
    let actual = execute(source);
    assert.equal(target,actual);
}



function execute_and_compare_error(file) {
    let source = fs.readFileSync(file, 'utf8');
    let targetFile = file + '.err';
    let target = fs.existsSync(targetFile) ? fs.readFileSync(targetFile, 'utf8') : '';
    console.log(target);
    assert.throws(function() { execute(source) }, Error, target);
}
