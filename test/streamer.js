const assert = require('chai').assert;
const streamer = require('../streamer.js');

describe('streamer', function() {
    it('returns eof on an empty stream', function() {
       let stream = streamer.Stream("");
       assert.isTrue(stream.eof());
    });

    it('supports peek', function() {
        let stream = streamer.Stream("12345");
        assert.equal("1", stream.peek());
    });

    it('supports next', function() {
        let stream = streamer.Stream("12345");
        assert.equal("1", stream.next());
        assert.equal("2", stream.next());ßß
        assert.equal("3", stream.next());
        assert.equal("4", stream.next());
        assert.equal("5", stream.next());
        assert.isTrue(stream.eof());
    });

    it('includes row and column when failing', function() {
        let stream = streamer.Stream("12345");
        assert.throws(function() { stream.croak('test') }, Error, "test (1:0)");
    })

    it('includes row and column when failing', function() {
        let stream = streamer.Stream("12\n34");
        stream.next();
        stream.next();
        stream.next();
        stream.next();
        assert.throws(function() { stream.croak('test') }, Error, "test (2:1)");
    })
});
