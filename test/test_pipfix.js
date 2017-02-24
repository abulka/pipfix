let {Python, Pip, Which} = require('../lib.js')

var assert = require('assert');  // https://nodejs.org/api/assert.html
var should = require('should');  // https://github.com/shouldjs/should.js
var sinon = require('sinon');    // https://www.sitepoint.com/sinon-tutorial-javascript-testing-mocks-spies-stubs/
                                 // http://sinonjs.org/docs/#assertions
// to run
// ./node_modules/mocha/bin/mocha

describe('python existence', function() {  // npm install --save-dev mocha

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


});

