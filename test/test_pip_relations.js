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
  '/Library/Python/2.7/site-packages',
  '/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python27.zip',
  '/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7',
  '...',
]`
      }
      version() {
        super.version()
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
    pip_usr_local_bin.report()    // TODO shouldn't need to report to get this analysis done
    console.log(pip_usr_local_bin.report_obj.associations)
    pip_usr_local_bin.report_obj.associations['/usr/bin/python'].should.be.true()
    spy1.restore();
  });


  it('/usr/bin/python and /usr/local/bin/pip both exist, but are not associated', function() {
    class SpawnMock extends BaseSpawnMockBehaviour {
      ls() {
        super.ls()
        switch (this.params[1]) {
          case '/usr/bin/python':
            this.select('ls_success')
            break
          case '/usr/local/bin/pip':
            this.select('ls_success')
            break
        }
      }
      python_m_site() {
        super.python_m_site()
        // mock the typical result on a mac of "/usr/bin/python -m site"
        // note that we do not expect any line
        // the site reported via "pip --version"
        this.result.stdout = `
sys.path = [
  '/Library/Blah.egg',
  '/Library/Blah/Blah/Blah/Python/2.7/site-packages',
  '...',
]`
      }
      version() {
        super.version()
        if (this.cmd == '/usr/local/bin/pip')
          this.result.stdout = 'pip 7.1.0 from /Library/Python/2.7/site-packages/pip-7.1.0-py2.7.egg (python 2.7)'
        else if (this.cmd == '/usr/bin/python')
          this.result.stderr = 'Python 2.7.0'
      }
    }
    mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
    let {Brain, Python} = require('../lib.js')
    let brain = new Brain()
    brain.get_pip('/usr/local/bin/pip').report()    // TODO shouldn't need to report to get this analysis done
    brain.get_pip('/usr/local/bin/pip').report_obj.associations['/usr/bin/python'].should.be.false()
  })


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
