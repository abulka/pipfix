var assert = require('assert');     // https://nodejs.org/api/assert.html
var should = require('should');     // https://github.com/shouldjs/should.js
var sinon = require('sinon');       // https://www.sitepoint.com/sinon-tutorial-javascript-testing-mocks-spies-stubs/
var mockery = require('mockery');   // https://github.com/mfncooper/mockery
var {BaseSpawnMockBehaviour, make_mock_spawn_func, SPAWN_RESULTS} = require('./mock_data.js')

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

  it('python_usr_bin has no pip', function() {
    // TODO
  })


  it('/usr/bin/python and /usr/local/bin/pip both exist, but are not associated', function() {
    // TODO
  })


  it('/usr/bin/python and /usr/local/bin/pip both exist, associated ok', function() {

    class SpawnMock extends BaseSpawnMockBehaviour {
      ls() {
        super.ls()
        switch (this.params[1]) {
          case '/usr/bin/python':
            this.select('ls_success')
            break
          case '/usr/local/bin/python':
            this.select('ls_fail')
            break
          case '/usr/local/bin/pip':
            this.select('ls_success')
            break
        }
      }
      python_m_site() {
        super.python_m_site()
        // mock the typical result on a mac of "/usr/bin/python -m site"
        // note that we expect the line "/Library/Python/2.7/site-packages" to match
        // the site reported via "pip --version"
        this.result.stdout = `
sys.path = [
  '/Library/Python/2.7/site-packages/pip-7.1.0-py2.7.egg',
  '/usr/local/lib/wxPython-unicode-2.8.12.1/lib/python2.7/site-packages',
  '/usr/local/lib/wxPython-unicode-2.8.12.1/lib/python2.7/site-packages/wx-2.8-mac-unicode',
  '/Library/Python/2.7/site-packages',
  '/usr/local/lib/wxPython-unicode-2.8.12.1/lib/python2.7',
  '/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python27.zip',
  '/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7',
  '/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/plat-darwin',
  '/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/plat-mac',
  '/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/plat-mac/lib-scriptpackages',
  '/System/Library/Frameworks/Python.framework/Versions/2.7/Extras/lib/python',
  '/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/lib-tk',
  '/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/lib-old',
  '/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/lib-dynload',
  '/System/Library/Frameworks/Python.framework/Versions/2.7/Extras/lib/python/PyObjC',
]`
      }
      version() {
        super.version()
        // console.log('this.params[0]', this.params[0], this.cmd)
        if (this.cmd == '/usr/local/bin/pip')
          this.result.stdout = 'pip 7.1.0 from /Library/Python/2.7/site-packages/pip-7.1.0-py2.7.egg (python 2.7)'
        else if (this.cmd == '/usr/bin/python')
          this.result.stderr = 'Python 2.7.0'
      }
    }
    mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
    let {Brain, Python} = require('../lib.js')
    let spy1 = sinon.spy(Python.prototype, 'analyse_site_info')
    let brain = new Brain()
    sinon.assert.callCount(spy1, 1)  // Ensure analyse_site_info() was called within Python class
    brain.pythons.length.should.be.equal(1)
    brain.pips.length.should.be.equal(1)
    let python_usr_bin = brain.get_python('/usr/bin/python')
    let pip_usr_local_bin = brain.get_pip('/usr/local/bin/pip')
    python_usr_bin.exists.should.be.true()
    python_usr_bin.runs_ok.should.be.true()
    pip_usr_local_bin.exists.should.be.true()


    // TEST python.result_shell_site_info.stdout
    //
    // console.log("SPAWN_RESULTS['python_m_site_1']", SPAWN_RESULTS['python_m_site_1']['stdout'])
    // console.log("python_usr_bin.result_shell_site_info.stdout", python_usr_bin.result_shell_site_info.stdout)
    // console.log(python_usr_bin.result_shell_site_info.stdout == SPAWN_RESULTS['python_m_site_1']['stdout'])
    // assert.equal(python_usr_bin.result_shell_site_info.stdout == SPAWN_RESULTS['python_m_site_1']['stdout'], true)
    // python_usr_bin.result_shell_site_info.stdout.should.equal(SPAWN_RESULTS['python_m_site_1']['stdout'])


    // TEST python.site_info
    //
    // assert.equal(python_usr_bin.site_info == SPAWN_RESULTS['python_m_site_1']['stdout'], true)
    // python_usr_bin.site_info.should.equal(SPAWN_RESULTS['python_m_site_1']['stdout'])

    // assert.equal(pip_usr_local_bin.report_obj.associations[python_usr_bin.path], true)

    // TEST python.result_shell_run_pip_as_module.stdout
    //
    // python_usr_bin.result_shell_run_pip_as_module.stdout == SPAWN_RESULTS

    /*
  'python_m_site_1': {  // some/python -m site
    'stdout': `
sys.path = [
'path1',
'path2',
'/Users/Andy/miniconda/lib/python2.7/site-packages',
]`,
     */
    pip_usr_local_bin.report()    // TODO shouldn't need to report to get this analysis done
    console.log(pip_usr_local_bin.report_obj.associations)
    pip_usr_local_bin.report_obj.associations['/usr/bin/python'].should.be.true()

    spy1.restore();
  });

  it('miniconda python and pip both exist as default, and are associated ok', function() {
    // TODO
    /*
    python_m_site() {
      super.python_m_site()
      this.result.stdout = `
sys.path = [
'path1',
'path2',
'/Users/Andy/miniconda/lib/python2.7/site-packages',
]`
    }
    version() {
      super.version()
      // console.log('this.params[0]', this.params[0], this.cmd)
      if (this.cmd == '/usr/local/bin/pip')
        this.result.stdout = 'pip 9.0.1 from /Users/Andy/miniconda/lib/python2.7/site-packages (python 2.7)'
      else if (this.cmd == '/usr/bin/python')
        this.result.stderr = 'Python 2.7.0'
    }
  }
    */

  })


});
