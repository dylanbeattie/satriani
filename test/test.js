var expect = require('chai').expect;
var assert = require('chai').assert;

var path = require('path');

const fs = require('fs');
var satriani = require('../satriani.js');

var fixtures = fs.readdirSync('test/fixtures');

describe('feature tests', function() {
    var fixtures = fs.readdirSync('test/fixtures');
    fixtures.forEach(fixture => {
        test_directory(path.join('test/fixtures/', fixture));
    });
});

function test_directory(directory) {
    describe(directory, function () {
        var files = fs.readdirSync(directory);
        files.forEach(file => {
            if (! /\.rock$/.test(file)) return;;
            it(file, function() {
                let source = fs.readFileSync(path.join(directory, file), 'utf8');
                let target = fs.readFileSync(path.join(directory, file)+'.out', 'utf8');
                let actual = satriani.interpret(source);
                assert.equal(target,actual);
            });
            console.log(file);
        });
        // for(var i = 0; i < files.length; i++) {
        //     file
        // }
        // it('lorge', function() {
        //     assert.equal(1,2);
        // })
        // fs.readdir(directory, (err, files) => {
        //     if (err) throw(err);
        //     files.forEach(file => {
        //         if (! /\.rock$/.test(file)) return;
        //         var fullPath = path.join(directory,file);
        //         it(fullPath, function () {
        //             fs.readFile(fullPath, 'utf8', (err, source) => {
        //                 if (err) throw(err);
        //                 fs.readFile(fullPath + '.out', 'utf8', (err, target) => {
        //                     console.log("TARGET: " + target);
        //                     //if (err) throw(err);
        //                     var output = satriani.interpret(source);
        //                     console.log("OUTPUT: " + output);
        //                     assert.equal(output, target);
        //                     assert.fail();
        //                 });
        //             });
        //         });
        //     });
        // });
    });
}
//
//
//
// do_test("pass");
// do_test("fail");
//
// function do_test(s) {
//     describe(s, function() {
//         it(s, function() {
//             expect(s).to.be.equals("pass");
//         });
//     })
// }
//
// describe('foo', function() {
//     it('should do stuff', function() {
//
//         expect(5).to.be.equals(5);
//
//     })
// });
