var assert = require('assert');     // https://nodejs.org/api/assert.html
var should = require('should');     // https://github.com/shouldjs/should.js
var sinon = require('sinon');       // https://www.sitepoint.com/sinon-tutorial-javascript-testing-mocks-spies-stubs/
var mockery = require('mockery');   // https://github.com/mfncooper/mockery
var {BaseSpawnMockBehaviour, make_mock_spawn_func, SPAWN_RESULTS} = require('./mock_data.js')

describe('existence', function() {

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


  describe('python usr_bin does not exist', function () {

    class SpawnMock extends BaseSpawnMockBehaviour {
      ls() {
        switch (this.params[1]) {
          case '/usr/bin/python':
            this.select('ls_fail')
            break
          case '/usr/local/bin/python':
            this.select('ls_success')
            break
        }
      }
      which_python() {
        this.select('which_python_usr_local_bin')
      }
    }

    it('python_usr_bin does not exist', function () {
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Python} = require('../lib.js')
      let python_usr_bin = new Python('/usr/bin/python')

      python_usr_bin.exists.should.be.false()
    });


    it('usr_local_bin python exists and is default', function () {
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Python} = require('../lib.js')
      let python_usr_local_bin = new Python('/usr/local/bin/python')

      python_usr_local_bin.exists.should.be.true()
      // python_usr_local_bin.is_default.should.be.true()  // TODO need to use brain to get this smart...
    });

  });


});

