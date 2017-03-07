var assert = require('assert');     // https://nodejs.org/api/assert.html
var should = require('should');     // https://github.com/shouldjs/should.js
var sinon = require('sinon');       // https://www.sitepoint.com/sinon-tutorial-javascript-testing-mocks-spies-stubs/
var mockery = require('mockery');   // https://github.com/mfncooper/mockery
var {BaseSpawnMockBehaviour, make_mock_spawn_func, SPAWN_RESULTS} = require('./mock_data.js')

describe('class Pip', function() {

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

  it('/usr/local/bin/pip exists', function() {

    class SpawnMock extends BaseSpawnMockBehaviour {
      ls() {
        switch (this.params[1]) {
          case '/usr/local/bin/pip':
            this.select('ls_success')
            break
        }
      }
    }
    mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
    let {Pip} = require('../lib.js')
    let pip_usr_local_bin = new Pip('/usr/local/bin/pip')
    assert.equal(pip_usr_local_bin.exists, true);
  });


  it('/usr/local/bin/pip does not exist', function() {

    class SpawnMock extends BaseSpawnMockBehaviour {
      ls() {
        switch (this.params[1]) {
          case '/usr/local/bin/pip':
            this.select('ls_fail')
            break
        }
      }
    }
    mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
    let {Pip} = require('../lib.js')
    let pip_usr_local_bin = new Pip('/usr/local/bin/pip')
    assert.equal(pip_usr_local_bin.exists, false);
  });


  it('/usr/local/bin/pip runs ok but is empty - edge case', function() {

    class SpawnMock extends BaseSpawnMockBehaviour {
      ls() {
        switch (this.params[1]) {
          case '/usr/local/bin/pip':
            this.select('ls_success')
            break
        }
      }
      version() {
        super.version()
        this.result.stderr = ''
        this.result.stdout = ''  // edge case - should normally return something like
                                 // 'pip 7.1.0 from /Library/Python/2.7/site-packages/pip-7.1.0-py2.7.egg (python 2.7)'
      }
      wc() {
        super.wc()
        this.result.stderr = ''
        this.result.stdout = '     0 /usr/local/bin/pip'  // edge case, normally shouldn't be 0
      }
    }
    mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
    let {Pip} = require('../lib.js')
    let pip = new Pip('/usr/local/bin/pip')
    pip.runs_ok.should.be.true()
    pip.size.should.be.equal(0)

  })


});

