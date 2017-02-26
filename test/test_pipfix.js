var assert = require('assert');     // https://nodejs.org/api/assert.html
var should = require('should');     // https://github.com/shouldjs/should.js
var sinon = require('sinon');       // https://www.sitepoint.com/sinon-tutorial-javascript-testing-mocks-spies-stubs/
var mockery = require('mockery');   // https://github.com/mfncooper/mockery
var {BaseSpawnMockBehaviour, spawn_result, spawn_results} = require('./util.js')

describe('python existence', function() {

  describe('system python', function() {

    beforeEach(function() {
      // runs before each test in this block
      mockery.enable({
          warnOnReplace: false,
          warnOnUnregistered: false,
          useCleanCache: true  // ensure we clear old requires() between tests
      });
    });

    afterEach(function() {
      // runs after each test in this block
      mockery.disable();
    });

    it('python_usr_bin exists', function() {

      let child_process_Mock = {
        spawnSync: function(cmd, param_array) {
          return (new BaseSpawnMockBehaviour(cmd, param_array)).process_possible_commands()
        }
      }
      mockery.registerMock('child_process', child_process_Mock);
      let {Python, Pip, Which} = require('../lib.js')

      let validSpy = sinon.spy(Python.prototype, 'valid');
      let analyseSpy = sinon.spy(Python.prototype, 'analyse');

      // debugger
      let python_usr_bin = new Python('/usr/bin/python')

      assert.equal(python_usr_bin.path, '/usr/bin/python');
      assert.equal(python_usr_bin.exists, true);

      // console.log(analyseSpy.callCount)
      // console.log(validSpy.callCount)

      sinon.assert.callCount(analyseSpy, 1);
      sinon.assert.called(validSpy);
      // sinon.assert.callCount(validSpy, 5);

      analyseSpy.restore();
      validSpy.restore();

    });

    it('python_usr_bin does not exist', function() {
      class SpawnMockBehaviourLs2 extends BaseSpawnMockBehaviour {
        ls() {
          if (this.is_ls)
            return spawn_result(spawn_results['ls_2'])
        }
      }
      let child_process_Mock = {
        spawnSync: function(cmd, param_array) {
          return (new SpawnMockBehaviourLs2(cmd, param_array)).process_possible_commands()
        }
      }
      mockery.registerMock('child_process', child_process_Mock);
      let {Python, Pip, Which} = require('../lib.js')

      let python_usr_bin = new Python('/usr/bin/python')

      assert.equal(python_usr_bin.exists, false);
    });

  });

});

