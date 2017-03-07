var assert = require('assert');  // https://nodejs.org/api/assert.html
var should = require('should');  // https://github.com/shouldjs/should.js
var mockery = require('mockery');   // https://github.com/mfncooper/mockery

// npm install --save-dev mocha

// To run tests don't run node, just run mocha and it will scan for stuff in the 'test' dir
// ./node_modules/mocha/bin/mocha
// ./node_modules/mocha/bin/mocha --fgrep "some text to match"
// etc.

describe('experiments - mocha, asserts and should library', function() {

  function utility() { return true }

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

  describe('should library', function() {

    it('should return -1 when the value is not present - uses should assert library', function() {
      [1,2,3].indexOf(5).should.equal(-1);
      [1,2,3].indexOf(0).should.equal(-1);
    });

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

  describe('can call a utility function', function() {
    it('utility_func() should return true', function() {
      assert.equal(utility(), true);
      assert(utility());
    });
  });

  // Testing asynchronous code with Mocha could not be simpler!

  describe('asynch_operations', function() {

    // Simply invoke the callback when your test is
    // complete. By adding a callback (usually named done) to it(), Mocha will know that it should wait for this
    // function to be called to complete the test.

    it('should save without error', function(done) {
      var user = new User('Luna');
      user.save(function(err) {
        if (err) done(err);
        else done();
      });
    });

    it('async save example two - should save without error', function(done) {
      // To make things even easier, the done() callback accepts an error, so we may use this directly:
      var user = new User('Luna');
      user.save(done);
    });
  });

});

