var assert = require('assert');     // https://nodejs.org/api/assert.html
var should = require('should');     // https://github.com/shouldjs/should.js
var sinon = require('sinon');       // https://www.sitepoint.com/sinon-tutorial-javascript-testing-mocks-spies-stubs/
var mockery = require('mockery');   // https://github.com/mfncooper/mockery
var {BaseSpawnMockBehaviour, make_mock_spawn_func, SPAWN_RESULTS} = require('./mock_data.js')

describe('Python class', function() {

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

  it('/usr/bin/python exists', function () {

    class SpawnMock extends BaseSpawnMockBehaviour {
      ls() {
        super.ls()
        switch (this.params[1]) {
          case '/usr/bin/python':
            this.select('ls_success')
            break
        }
      }
    }
    mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
    let {Python} = require('../lib.js')
    let validSpy = sinon.spy(Python.prototype, 'valid');
    let analyseSpy = sinon.spy(Python.prototype, 'analyse');
    let python_usr_bin = new Python('/usr/bin/python')
    assert.equal(python_usr_bin.path, '/usr/bin/python');
    assert.equal(python_usr_bin.exists, true);
    sinon.assert.callCount(analyseSpy, 1);
    sinon.assert.called(validSpy);
    // sinon.assert.callCount(validSpy, 5);
    analyseSpy.restore();
    validSpy.restore();
  });


  it('/usr/bin/python does not exist', function() {

    class SpawnMock extends BaseSpawnMockBehaviour {
      ls() {
        switch (this.params[1]) {
          case '/usr/bin/python':
            this.select('ls_fail')
            break
        }
      }
    }
    mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
    let {Python} = require('../lib.js')
    let p = new Python('/usr/bin/python')
    p.exists.should.be.false()
  });


  it('/usr/local/bin/python exists', function() {

    class SpawnMock extends BaseSpawnMockBehaviour {
      ls() {
        switch (this.params[1]) {
          case '/usr/local/bin/python':
            this.select('ls_success')
            break
        }
      }
    }
    mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
    let {Python} = require('../lib.js')
    let p = new Python('/usr/local/bin/python')
    p.exists.should.be.true()
  });


  it('/usr/local/bin/python does not exist', function() {

    class SpawnMock extends BaseSpawnMockBehaviour {
      ls() {
        switch (this.params[1]) {
          case '/usr/local/bin/python':
            this.select('ls_fail')
            break
        }
      }
    }
    mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
    let {Python} = require('../lib.js')
    let p = new Python('/usr/local/bin/python')
    p.exists.should.be.false()
  });


  it('/usr/bin/python and /usr/local/bin/python both exist', function() {

    class SpawnMock extends BaseSpawnMockBehaviour {
      ls() {
        switch (this.params[1]) {
          case '/usr/bin/python':
            this.select('ls_success')
            break
        }
        switch (this.params[1]) {
          case '/usr/local/bin/python':
            this.select('ls_success')
            break
        }
      }
    }
    mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
    let {Python} = require('../lib.js')
    let p1 = new Python('/usr/bin/python')
    let p2 = new Python('/usr/local/bin/python')
    p1.exists.should.be.true()
    p2.exists.should.be.true()
  });


  it('/usr/bin/python and /usr/local/bin/python both do not exist', function() {

    class SpawnMock extends BaseSpawnMockBehaviour {
      ls() {
        switch (this.params[1]) {
          case '/usr/bin/python':
            this.select('ls_fail')
            break
        }
        switch (this.params[1]) {
          case '/usr/local/bin/python':
            this.select('ls_fail')
            break
        }
      }
    }
    mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
    let {Python} = require('../lib.js')
    let p1 = new Python('/usr/bin/python')
    let p2 = new Python('/usr/local/bin/python')
    p1.exists.should.be.false()
    p2.exists.should.be.false()
  });


  it('/usr/local/bin/python exists but is not valid', function() {

    class SpawnMock extends BaseSpawnMockBehaviour {
      ls() {
        switch (this.params[1]) {
          case '/usr/local/bin/python':
            this.select('ls_success')
            break
        }
      }
      version() {
        super.version()
        this.result.stderr = 'some error'
      }
    }
    mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
    let {Python} = require('../lib.js')
    let p = new Python('/usr/local/bin/python')
    p.exists.should.be.true()
    p.runs_ok.should.be.false()  // not valid, as determined by running --version on it and getting error
  });


  it('/usr/local/bin/python exists and is valid', function() {

    class SpawnMock extends BaseSpawnMockBehaviour {
      ls() {
        switch (this.params[1]) {
          case '/usr/local/bin/python':
            this.select('ls_success')
            break
        }
      }
      version() {
        super.version()
        this.result.stderr = 'Python 2.7.0'
      }
    }
    mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
    let {Python} = require('../lib.js')
    let p = new Python('/usr/local/bin/python')
    p.exists.should.be.true()
    p.runs_ok.should.be.true()  // note python 2 returns version in stderr
  });

});
