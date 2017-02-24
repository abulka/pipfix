var assert = require('assert');  // https://nodejs.org/api/assert.html
var should = require('should');  // https://github.com/shouldjs/should.js

// to run
// ./node_modules/mocha/bin/mocha

describe('TestingPlay', function() {  // npm install --save-dev mocha

  function fred() { return true }
  class User {
    save(f) { f() }
  }

  // Tests begin

  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });

  // should library

  describe('#indexOf_again()', function() {
    it('should return -1 when the value is not present - uses should assert library', function() {
      [1,2,3].indexOf(5).should.equal(-1);
      [1,2,3].indexOf(0).should.equal(-1);
    });
  });

  describe('should examples', function() {
    it('should examples all sorts of them', function() {
      (5).should.be.exactly(5).and.be.a.Number();

      // test 'string' type
      ('foobar').should.be.type('string');
      // then that actual value '==' expected value
      ('foobar' == 'foobar').should.be.ok;
      // then that actual value '===' expected value
      ('foobar').should.be.equal('foobar');

    });
  });

  // my own attempt at a test

  describe('fred', function() {
    it('should return true', function() {
      assert.equal(fred(), true);
      assert(fred());
    });
  });

  // Testing asynchronous code with Mocha could not be simpler!

  // Simply invoke the callback when your test is
  // complete. By adding a callback (usually named done) to it(), Mocha will know that it should wait for this
  // function to be called to complete the test.
  describe('asynch_operations', function() {
    it('should save without error', function(done) {
      var user = new User('Luna');
      user.save(function(err) {
        if (err) done(err);
        else done();
      });
    });
  });

  // To make things even easier, the done() callback accepts an error, so we may use this directly:
  describe('asyncsave2()', function() {
    it('should save without error', function(done) {
      var user = new User('Luna');
      user.save(done);
    });
  });


});

