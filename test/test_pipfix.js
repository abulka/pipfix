let {Python, Pip, Which} = require('../lib.js')

var assert = require('assert');     // https://nodejs.org/api/assert.html
var should = require('should');     // https://github.com/shouldjs/should.js
var sinon = require('sinon');       // https://www.sitepoint.com/sinon-tutorial-javascript-testing-mocks-spies-stubs/
                                    // http://sinonjs.org/docs/#assertions
var mockery = require('mockery');   // https://github.com/mfncooper/mockery

// npm install --save-dev mocha
// npm install --save-dev sinon
// npm install --save-dev mockery

// To run tests don't run node, just run mocha and it will scan for stuff in the 'test' dir
// ./node_modules/mocha/bin/mocha
// ./node_modules/mocha/bin/mocha --fgrep system
// etc.

describe('python existence', function() {

  describe('one system python only', function() {

    it('should return true', function() {

      let validSpy = sinon.spy(Python.prototype, 'valid');
      let analyseSpy = sinon.spy(Python.prototype, 'analyse');

      let python_usr_bin = new Python('/usr/bin/python')


      assert.equal(python_usr_bin.path, '/usr/bin/python');

      // console.log(analyseSpy.callCount)
      // console.log(validSpy.callCount)

      sinon.assert.called(validSpy);
      sinon.assert.callCount(validSpy, 5);

      sinon.assert.callCount(Python.prototype.analyse, 1);
      sinon.assert.callCount(analyseSpy, 1);
      assert.equal(analyseSpy, Python.prototype.analyse)

      analyseSpy.restore();
      validSpy.restore();

    });
  });

  describe('mockery experiments', function() {

    before(function() {
      // runs before all tests in this block
      mockery.enable();
    });

    after(function() {
      // runs after all tests in this block
      mockery.disable();
    });

    beforeEach(function() {
      // runs before each test in this block
    });

    afterEach(function() {
      // runs after each test in this block
    });

    it('should mock fs', function() {

      var fsMock = {
          stat: function (path, cb) { /* your mock code */ }
      };
      mockery.registerMock('fs', fsMock);
      // mockery.registerMock('../some-other-module', stubbedModule);

      mockery.deregisterMock('fs');

    });
  });


});

