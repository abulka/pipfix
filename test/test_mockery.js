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
// ./node_modules/mocha/bin/mocha --fgrep "some text to match"
// etc.

describe('mockery experiments', function() {

  // describe('disabled cos accesses real file system for python - uses no mockery just sinon', function() {
  //
  //   it('real call checking for python_usr_bin', function() {
  //
  //     let {Python, Pip, Which} = require('../lib.js')  // CAREFUL - letting in one real require subverts the mocking later....
  //                                                      // even when its done within an inner scope like this
  //                                                      // UNLESS you call mockery.enable({ useCleanCache: true }) before() each test.
  //
  //     let validSpy = sinon.spy(Python.prototype, 'valid');
  //     let analyseSpy = sinon.spy(Python.prototype, 'analyse');
  //
  //     let python_usr_bin = new Python('/usr/bin/python')
  //
  //
  //     assert.equal(python_usr_bin.path, '/usr/bin/python');
  //
  //     // console.log(analyseSpy.callCount)
  //     // console.log(validSpy.callCount)
  //
  //     sinon.assert.called(validSpy);
  //     sinon.assert.callCount(validSpy, 5);
  //
  //     sinon.assert.callCount(Python.prototype.analyse, 1);
  //     sinon.assert.callCount(analyseSpy, 1);
  //     assert.equal(analyseSpy, Python.prototype.analyse)
  //
  //     analyseSpy.restore();
  //     validSpy.restore();
  //
  //   });
  // });

  describe('deeper mockery experiments', function() {

    before(function() {
      // runs before all tests in this block

      // mockery.enable();

      mockery.enable({
          warnOnReplace: false,
          warnOnUnregistered: false,
          useCleanCache: true  // attempt to allow old requires() to expire between tests - works!
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
          fs_play: function () {
            //console.log('fs_play mock called!')
          }
      };
      mockery.registerMock('../fs_play.js', fs_playMock)  // needs to be first, before you use the require()
      let fs_play = require('../fs_play.js')

      fs_play.fs_play()

      mockery.deregisterMock('../fs_play.js');

    });

    it('fs_play mock attempt of just the fs import within the module', function() {
      var fsMock = {
          stat: function (path, cb) { /* your mock code */
                                      console.log('fake stat called fs_play');
                                      let stats = 'some mock stats....'
                                      cb(0, stats)
                                    }
      };
      mockery.registerMock('fs', fsMock);
      let fs_play = require('../fs_play.js')

      fs_play.fs_play()

      mockery.deregisterMock('fs');

    });

    it('fs_play (again) mock attempt of just the fs import within the module', function() {
      var fsMock = {
          stat: function (path, cb) { /* your mock code */
                                      console.log('fake stat called fs_play (again)');
                                      let stats = 'some mock stats....'
                                      cb(0, stats)
                                    }
      };
      mockery.registerMock('fs', fsMock);
      mockery.resetCache(); // does this work on the global require cache?  No.
      let fs_play = require('../fs_play.js')   // HA THIS DOESN'T WORK - THE OLD REQUIRE FROM THE PREVIOUS TEST STILL IS IN PLACE

      fs_play.fs_play()

      mockery.deregisterMock('fs');

    });

    it('fs_play2 mock attempt of just the fs import within the module', function() {
      var fsMock = {
          stat: function (path, cb) { /* your mock code */
                                      console.log('fake stat called fs_play2');
                                      let stats = 'some mock stats....'
                                      cb(0, stats)
                                    }
      };
      mockery.registerMock('fs', fsMock);
      let fs_play = require('../fs_play2.js')

      fs_play.fs_play()

      mockery.deregisterMock('fs');

    });

    it('fake one system python only', function() {

      let result_shell = {
        stdout: null,
        stderr: null,
        args: ['cmd', 'param1', 'param2']
      }
      let child_process_Mock = {
        spawnSync: function(cmd, param_array) {

          switch (cmd) {
            case 'ls':
              console.log('fake spawnSync ls')
              return {
                stdout: '',
                stderr: 'no such file',
                args: ['ls', 'param1', 'param2']
              }
              break
            case 'wc':
              console.log('fake spawnSync wc')
              return {
                stdout: '',
                stderr: 'wc blah blah',
                args: ['wc', 'param1', 'param2']
              }
              break
          }

          if (param_array[0] == '--version') {
            console.log('fake spawnSync --version')
            return {
              stdout: '',
              stderr: '--version blah blah',
              args: ['??', '--version', 'param2']
            }
          }

          return result_shell
        }
      }
      mockery.registerMock('child_process', child_process_Mock);

      let {Python, Pip, Which} = require('../lib.js')

      // let validSpy = sinon.spy(Python.prototype, 'valid');
      // let analyseSpy = sinon.spy(Python.prototype, 'analyse');
      //
      let python_usr_bin = new Python('/usr/bin/python')


      assert.equal(python_usr_bin.path, '/usr/bin/python');
      assert.equal(python_usr_bin.exists, false);

      //
      // // console.log(analyseSpy.callCount)
      // // console.log(validSpy.callCount)
      //
      // sinon.assert.called(validSpy);
      // sinon.assert.callCount(validSpy, 5);
      //
      // sinon.assert.callCount(Python.prototype.analyse, 1);
      // sinon.assert.callCount(analyseSpy, 1);
      // assert.equal(analyseSpy, Python.prototype.analyse)
      //
      // analyseSpy.restore();
      // validSpy.restore();

      mockery.deregisterMock('child_process');

    });


  });


});

