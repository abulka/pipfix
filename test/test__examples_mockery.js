var assert = require('assert');     // https://nodejs.org/api/assert.html
var should = require('should');     // https://github.com/shouldjs/should.js
var sinon = require('sinon');       // https://www.sitepoint.com/sinon-tutorial-javascript-testing-mocks-spies-stubs/
                                    // http://sinonjs.org/docs/#assertions
var mockery = require('mockery');   // https://github.com/mfncooper/mockery

/*
 npm install --save-dev mocha
 npm install --save-dev sinon
 npm install --save-dev mockery

 To run tests don't run node, just run mocha and it will scan for stuff in the 'test' dir
   ./node_modules/mocha/bin/mocha
   ./node_modules/mocha/bin/mocha --fgrep "some text to match"
 etc.
*/

describe('experiments - mockery', function() {

  beforeEach(function() {
    mockery.enable({
        warnOnReplace: false,
        warnOnUnregistered: false,
        useCleanCache: true  // attempt to allow old requires() to expire between tests - works!
    });
  });

  afterEach(function() {
    mockery.disable();
  });


  it('mock system fs.stat()', function() {
    let fsMock = {
        stat: function (path, cb) { /* your mock code */ flag = true }
    };
    let flag = false

    // Call to 'registerMock' needs to be first, before you use the require()
    // Parameter one is the module you are mocking, using require syntax.  Parameter two is an object {}
    // representing the mocked namespace - you can add the functions names as keys and functions as values.
    mockery.registerMock('fs', fsMock);

    // Careful, doing a non mocked 'real' require subverts the mocking later on
    // even when its done within an inner scope like within this test
    // To be safe call mockery.enable({ useCleanCache: true }) before() each test to clear out the require cache.
    let fs = require('fs')

    // Call the function
    fs.stat('some/path')

    // Test
    flag.should.be.true()

    mockery.deregisterMock('fs');
  });


  it('mock entire module - replace the example() function', function() {
    var myModuleMock = {
        example: function () {
          flag = true
        }
    }
    let flag = false
    let MODULE_NAME = './_example_module.js'
    mockery.registerMock(MODULE_NAME, myModuleMock)
    let module = require(MODULE_NAME)
    module.example()
    flag.should.be.true()
    mockery.deregisterMock(MODULE_NAME);
  });


  it('mock just the require fs within an imported module', function() {
    var fsMock = {
      stat: function (path, cb) {
        flag = true
        let stats = 'some mock stats....'
        cb(0, stats)  // this calls the callback inside the module's example() function
      }
    }
    mockery.registerMock('fs', fsMock)  // note we are not replacing the entire '_example_module.js' module but only the 'fs' module that it uses
    let module = require('./_example_module.js')

    // Reset flags
    let flag = false  // tells us if out mock was called
    module.reset_flag()  // tells us if the callback in the module's example() function was called

    // The module's real example() will be called, but the 'fs' use will be mocked
    module.example()

    // Test
    flag.should.be.true()
    module.get_flag().should.be.true()

    mockery.deregisterMock('fs');
  });

});

