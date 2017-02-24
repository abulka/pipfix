var assert = require('assert');     // https://nodejs.org/api/assert.html
var should = require('should');     // https://github.com/shouldjs/should.js
var sinon = require('sinon');       // https://www.sitepoint.com/sinon-tutorial-javascript-testing-mocks-spies-stubs/
var mockery = require('mockery');   // https://github.com/mfncooper/mockery

function UserException(message) {
   this.message = message;
   this.name = 'UserException';
}

describe('python existence', function() {

  describe('system python', function() {

    before(function() {
      // runs before all tests in this block
    });

    after(function() {
      // runs after all tests in this block
    });

    beforeEach(function() {
      // runs before each test in this block
      mockery.enable({
          warnOnReplace: false,
          warnOnUnregistered: false,
          useCleanCache: true  // ensure we clear old requires() between tests - works!
      });
    });

    afterEach(function() {
      // runs after each test in this block
      mockery.disable();
    });

    function build_spawn_result(stdout, stderr, arg, params_array) {
      return {
        stdout: stdout,
        stderr: stderr,
        args: [arg, 'param1', 'param2']  // TODO convert 'params_array' into array within 'args' array
      }
    }

    // TESTS BEGIN

    it('python_usr_bin exists', function() {

      let child_process_Mock = {
        spawnSync: function(cmd, param_array) {
          switch (cmd) {
            case 'ls':
              return build_spawn_result('', 'no such file', 'ls', ['param1', 'param2'])
            case 'wc':
              return build_spawn_result('', 'wc err blah blah', 'wc', ['param1', 'param2'])
          }
          if (param_array[0] == '--version')
              return build_spawn_result('', '--version err blah blah', '??', ['--version', 'param2'])
          else if (param_array[0] == '-m' && param_array[1] == 'site') {
            let sys_path = `
sys.path = [
      'path1', 
      'path2', 
      '/Users/Andy/miniconda/lib/python2.7/site-packages',
]`
            return build_spawn_result(sys_path, '', '??', ['-m', 'site'])
          }
          else if (param_array[0] == '-m' && param_array[1] == 'pip' && param_array[2] == '--version') {
            let stdout = 'pip 9.0.1 from /Users/Andy/miniconda/lib/python2.7/site-packages (python 2.7)'
            return build_spawn_result(stdout, '', '??', ['-m', 'pip', '--version'])
          }
          throw new UserException(`unknown case not sure how to mock ${cmd} with params ${param_array}`)
        }
      }
      mockery.registerMock('child_process', child_process_Mock);
      let {Python, Pip, Which} = require('../lib.js')

      let validSpy = sinon.spy(Python.prototype, 'valid');
      let analyseSpy = sinon.spy(Python.prototype, 'analyse');

      // debugger
      let python_usr_bin = new Python('/usr/bin/python')

      assert.equal(python_usr_bin.path, '/usr/bin/python');

      console.log(analyseSpy.callCount)
      console.log(validSpy.callCount)

      sinon.assert.callCount(analyseSpy, 1);
      sinon.assert.called(validSpy);
      // sinon.assert.callCount(validSpy, 5);

      analyseSpy.restore();
      validSpy.restore();

    });

    it('python_usr_bin does not exist', function() {
      // TODO
    });

  });

});

