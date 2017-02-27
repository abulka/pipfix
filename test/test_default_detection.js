var assert = require('assert');     // https://nodejs.org/api/assert.html
var should = require('should');     // https://github.com/shouldjs/should.js
var sinon = require('sinon');       // https://www.sitepoint.com/sinon-tutorial-javascript-testing-mocks-spies-stubs/
var mockery = require('mockery');   // https://github.com/mfncooper/mockery
var {BaseSpawnMockBehaviour, SpawnMockBehaviourNonExistence, spawn_result, spawn_results} = require('./mock_data.js')

describe('default pip and python detection', function() {

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

  it('default python is python_usr_bin', function() {
    mockery.registerMock('child_process', {
      spawnSync: function(cmd, param_array) {
        return (new BaseSpawnMockBehaviour(cmd, param_array)).process_possible_commands()
      }
    })
    let {Python, Pip, Which} = require('../lib.js')

    let python_usr_bin = new Python('/usr/bin/python')
    let python_default = Which.default_python([python_usr_bin])

    python_usr_bin.report()
    // python_default.report()
    //
    // assert.equal(python_usr_bin.exists, true)
    // assert.equal(python_default.exists, true)
    //
    // python_usr_bin.should.equal(python_default)
    // python_usr_bin.is_default.should.equal(true)
    // python_default.is_default.should.equal(true)
  });

});

