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


  it('python_usr_bin exists', function () {
    mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(BaseSpawnMockBehaviour) })
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


});

