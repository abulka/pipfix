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

      // mockery.enable();

      mockery.enable({
          warnOnReplace: false,
          warnOnUnregistered: false
      });

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

    it('fs_play mock entire module', function() {
      var fs_playMock = {
          // stat: function (path, callback) { console.log('fs stat mock callback called!') /* your mock code */ }
          fs_play: function () { console.log('fs_play mock called!') }
      };
      mockery.registerMock('../fs_play.js', fs_playMock)  // needs to be first, before you use the require()
      fs_play = require('../fs_play.js')

      fs_play.fs_play()

      mockery.deregisterMock('../fs_play.js');

    });

    it('fs_play mock attempt of just the fs import within the module', function() {
      var fsMock = {
          stat: function (path, cb) { /* your mock code */
                                      console.log('fake stat called');
                                      let stats = 'some mock stats....'
                                      cb(0, stats)
                                    }
      };
      mockery.registerMock('fs', fsMock);
      fs_play = require('../fs_play.js')

      fs_play.fs_play()

      mockery.deregisterMock('fs');

    });


  });


});

