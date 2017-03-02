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

  it('brain finds /usr/bin and /usr/local/bin python', function() {
    mockery.registerMock('child_process', {
      spawnSync: function(cmd, param_array) {
        return (new BaseSpawnMockBehaviour(cmd, param_array)).process_possible_commands()
      }
    })
    let {Python, Pip, Which, Brain} = require('../lib.js')

    let brain = new Brain()
    brain.pythons.length.should.equal(2)  // TODO need to be able to test that just one python exists - mock ls needs to be smarter
  });

  it('default python is python_usr_bin', function() {
    class SpawnMockBehaviourOnePython extends BaseSpawnMockBehaviour {
      ls() {
        if (this.is_ls)
          switch (this.param_array[1]) {
            case '/usr/bin/python':
              return spawn_result(spawn_results['ls_1'])
            case '/usr/local/bin/python':
              return spawn_result(spawn_results['ls_2'])  // mock a failed ls
          }
      }
    }
    mockery.registerMock('child_process', {
      spawnSync: function(cmd, param_array) {
        return (new SpawnMockBehaviourOnePython(cmd, param_array)).process_possible_commands()
      }
    })
    let {Python, Pip, Which, Brain} = require('../lib.js')

    let brain = new Brain()
    let python_usr_bin = brain.get_python('/usr/bin/python')
    let python_default = brain.python_default

    brain.pythons.length.should.be.equal(1)

    brain.pythons.map(p => p.path).indexOf('/usr/bin/python').should.be.aboveOrEqual(0)
    brain.pythons.map(p => p.path).indexOf('/usr/local/bin/python').should.be.equal(-1)

    python_usr_bin.exists.should.be.true()
    python_default.exists.should.be.true()

    python_usr_bin.should.equal(python_default)
    python_usr_bin.is_default.should.equal(true)
    python_default.is_default.should.equal(true)

    python_usr_bin.report()

  });

});
