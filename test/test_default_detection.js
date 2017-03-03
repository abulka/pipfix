var assert = require('assert');     // https://nodejs.org/api/assert.html
var should = require('should');     // https://github.com/shouldjs/should.js
var sinon = require('sinon');       // https://www.sitepoint.com/sinon-tutorial-javascript-testing-mocks-spies-stubs/
var mockery = require('mockery');   // https://github.com/mfncooper/mockery
var {BaseSpawnMockBehaviour, SPAWN_RESULTS} = require('./mock_data.js')

describe('default python detection', function() {

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
    class SpawnMock extends BaseSpawnMockBehaviour {
      ls() {
        switch (this.params[1]) {
          case '/usr/bin/python':
            this.select('ls_success')
            break
          case '/usr/local/bin/python':
            this.select('ls_success')
            break
        }
      }
      which_python() {
        this.select('which_python_usr_bin')
      }
    }
    mockery.registerMock('child_process', {
      spawnSync: function(cmd, param_array) {
        return (new SpawnMock(cmd, param_array)).process_possible_commands()
      }
    })
    let {Python, Pip, Which, Brain} = require('../lib.js')

    let brain = new Brain()
    brain.pythons.length.should.equal(2)
  });


  it('brain finds /usr/bin python only', function() {
    class SpawnMock extends BaseSpawnMockBehaviour {
      ls() {
        switch (this.params[1]) {
          case '/usr/bin/python':
            this.select('ls_success')
            break
          case '/usr/local/bin/python':
            this.select('ls_fail')
            break
        }
      }
      which_python() {
        this.select('which_python_usr_bin')
      }
    }
    mockery.registerMock('child_process', {
      spawnSync: function(cmd, param_array) {
        return (new SpawnMock(cmd, param_array)).process_possible_commands()
      }
    })
    let {Python, Pip, Which, Brain} = require('../lib.js')

    let brain = new Brain()
    brain.pythons.length.should.equal(1)
  });


  it('one default python is usr_bin', function() {
    class SpawnMock extends BaseSpawnMockBehaviour {
      ls() {
        switch (this.params[1]) {
          case '/usr/bin/python':
            this.select('ls_success')
            break
          case '/usr/local/bin/python':
            this.select('ls_fail')
            break
        }
      }
      which_python() {
        this.select('which_python_usr_bin')
      }
    }
    mockery.registerMock('child_process', {
      spawnSync: function(cmd, param_array) {
        return (new SpawnMock(cmd, param_array)).process_possible_commands()
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


  it('two pythons default python is usr_bin', function() {
    class SpawnMock extends BaseSpawnMockBehaviour {
      ls() {
        switch (this.params[1]) {
          case '/usr/bin/python':
            this.select('ls_success')
            break
          case '/usr/local/bin/python':
            this.select('ls_success')
            break
        }
      }
      which_python() {
        this.select('which_python_usr_bin')
      }
    }
    mockery.registerMock('child_process', {
      spawnSync: function(cmd, param_array) {
        return (new SpawnMock(cmd, param_array)).process_possible_commands()
      }
    })
    let {Python, Pip, Which, Brain} = require('../lib.js')

    let brain = new Brain()
    let python_usr_bin = brain.get_python('/usr/bin/python')
    let python_usr_local_bin = brain.get_python('/usr/local/bin/python')
    let python_default = brain.python_default

    brain.pythons.length.should.be.equal(2)

    brain.pythons.map(p => p.path).indexOf('/usr/bin/python').should.be.aboveOrEqual(0)
    brain.pythons.map(p => p.path).indexOf('/usr/local/bin/python').should.be.aboveOrEqual(0)

    python_usr_bin.exists.should.be.true()
    python_usr_local_bin.exists.should.be.true()
    python_default.exists.should.be.true()

    python_usr_bin.should.equal(python_default)
    python_usr_bin.is_default.should.equal(true)
    python_default.is_default.should.equal(true)
    python_usr_local_bin.is_default.should.equal(false)

    python_usr_bin.report()

  });


  it('two pythons default python is usr_local_bin', function() {
    class SpawnMock extends BaseSpawnMockBehaviour {
      which_python() {
        super.which_python()
        this.result.stdout = '/usr/local/bin/python'
      }
    }
    mockery.registerMock('child_process', {
      spawnSync: function(cmd, param_array) {
        return (new SpawnMock(cmd, param_array)).process_possible_commands()
      }
    })
    let {Python, Pip, Which, Brain} = require('../lib.js')

    let brain = new Brain()
    let python_usr_bin = brain.get_python('/usr/bin/python')
    let python_usr_local_bin = brain.get_python('/usr/local/bin/python')
    let python_default = brain.python_default

    brain.pythons.length.should.be.equal(2)

    brain.pythons.map(p => p.path).indexOf('/usr/bin/python').should.be.aboveOrEqual(0)
    brain.pythons.map(p => p.path).indexOf('/usr/local/bin/python').should.be.aboveOrEqual(0)

    python_usr_bin.exists.should.be.true()
    python_usr_local_bin.exists.should.be.true()
    python_default.exists.should.be.true()

    python_usr_bin.should.not.equal(python_default)
    python_usr_local_bin.should.equal(python_default)
    python_usr_bin.is_default.should.equal(false)
    python_default.is_default.should.equal(true)
    python_usr_local_bin.is_default.should.equal(true)

    python_usr_bin.report()

  });

});
