var assert = require('assert');     // https://nodejs.org/api/assert.html
var should = require('should');     // https://github.com/shouldjs/should.js
var sinon = require('sinon');       // https://www.sitepoint.com/sinon-tutorial-javascript-testing-mocks-spies-stubs/
var mockery = require('mockery');   // https://github.com/mfncooper/mockery
var {BaseSpawnMockBehaviour, SpawnMockBehaviourNonExistence, spawn_result, spawn_results} = require('./mock_data.js')

describe('pip python site relationships', function() {

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

  it('python_usr_bin has a usr_local_bin_pip', function() {
    mockery.registerMock('child_process', {
      spawnSync: function(cmd, param_array) {
        return (new BaseSpawnMockBehaviour(cmd, param_array)).process_possible_commands()
      }
    })
    let {Python, Pip, Which} = require('../lib.js')
    let spy1 = sinon.spy(Python.prototype, 'analyse_site_info');

    let python_usr_bin = new Python('/usr/bin/python')
    let pip_usr_local_bin = new Pip('/usr/local/bin/pip')
    pip_usr_local_bin.inform_about(python_usr_bin)

    python_usr_bin.report()
    pip_usr_local_bin.report()

    assert.equal(python_usr_bin.exists, true);
    assert.equal(pip_usr_local_bin.exists, true);

    // TEST ensure analyse_site_info() was called within Python class
    sinon.assert.callCount(spy1, 1)
    spy1.callCount.should.equal(1)


    // TEST python.result_shell_site_info.stdout
    //
    // console.log("spawn_results['python_m_site_1']", spawn_results['python_m_site_1']['stdout'])
    // console.log("python_usr_bin.result_shell_site_info.stdout", python_usr_bin.result_shell_site_info.stdout)
    // console.log(python_usr_bin.result_shell_site_info.stdout == spawn_results['python_m_site_1']['stdout'])
    assert.equal(python_usr_bin.result_shell_site_info.stdout == spawn_results['python_m_site_1']['stdout'], true)
    python_usr_bin.result_shell_site_info.stdout.should.equal(spawn_results['python_m_site_1']['stdout'])


    // TEST python.site_info
    //
    // assert.equal(python_usr_bin.site_info == spawn_results['python_m_site_1']['stdout'], true)
    // python_usr_bin.site_info.should.equal(spawn_results['python_m_site_1']['stdout'])

    // assert.equal(pip_usr_local_bin.report_obj.associations[python_usr_bin.path], true)

    // TEST python.result_shell_run_pip_as_module.stdout
    //
    // python_usr_bin.result_shell_run_pip_as_module.stdout == spawn_results


    spy1.restore();

  });

});

