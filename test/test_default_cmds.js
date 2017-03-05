var assert = require('assert');     // https://nodejs.org/api/assert.html
var should = require('should');     // https://github.com/shouldjs/should.js
var sinon = require('sinon');       // https://www.sitepoint.com/sinon-tutorial-javascript-testing-mocks-spies-stubs/
var mockery = require('mockery');   // https://github.com/mfncooper/mockery
var {BaseSpawnMockBehaviour, make_mock_spawn_func, SPAWN_RESULTS} = require('./mock_data.js')

describe('default command detection', function() {

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

  describe('one python', function() {

    it('one usr/bin/python - and is default', function() {
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
          }
        }
        which_python() {
          this.select('which_python_usr_bin')
        }
      }
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Brain} = require('../lib.js')
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
    });


    it('one usr/bin/python - and it is not default', function() {
      // TODO
    })


    it('one usr/local/bin/python - and is default', function() {
      class SpawnMock extends BaseSpawnMockBehaviour {
        ls() {
          super.ls()
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
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Brain} = require('../lib.js')
      let brain = new Brain()
      brain.pythons.length.should.be.equal(1)
      let p = brain.get_python('/usr/local/bin/python')
      assert(p != undefined)
      p.should.equal(brain.python_default)
      p.is_default.should.equal(true)
    })


    it('one usr/local/bin/python - and it is not default', function() {
      // TODO
    })

  })


  describe('two pythons', function() {

    class TwoPythonsFound extends BaseSpawnMockBehaviour {
      ls() {
        super.ls()
        switch (this.params[1]) {
          case '/usr/bin/python':
            this.select('ls_success')
            break
          case '/usr/local/bin/python':
            this.select('ls_success')
            break
        }
      }
    }

    it('two pythons found - default is usr/bin', function() {

      class SpawnMock extends TwoPythonsFound {
        which_python() {
          this.select('which_python_usr_bin')
        }
      }
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Brain} = require('../lib.js')

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
    });


    it('two pythons found - default is usr/local/bin', function() {
      class SpawnMock extends TwoPythonsFound {
        which_python() {
          super.which_python()
          this.result.stdout = '/usr/local/bin/python'
        }
      }
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Brain} = require('../lib.js')
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
    });


    it('two pythons found - neither is default', function() {
      // TODO
    })

  })

  describe('two pythons - miniconda is one of them', function() {

    /*
      the only way we detect miniconda or other python is if it is default
      thus we always know which is the default - its minconda python
     */

    it('two pythons - /usr/bin/python and default miniconda python', function() {

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
          }
        }
        which_python() {
          super.which_python()
          this.result.stdout = '/Users/Andy/miniconda/bin/python'
        }
      }
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Brain} = require('../lib.js')
      let brain = new Brain()
      let python_usr_bin = brain.get_python('/usr/bin/python')
      let python_usr_local_bin = brain.get_python('/usr/local/bin/python')
      let python_other = brain.get_python('/Users/Andy/miniconda/bin/python')
      let python_default = brain.python_default
      brain.pythons.length.should.be.equal(2)
      assert(python_usr_local_bin == undefined)
      python_usr_bin.should.not.be.undefined()
      python_other.should.not.be.undefined()
      brain.pythons.map(p => p.path).indexOf('/usr/bin/python').should.be.aboveOrEqual(0)
      brain.pythons.map(p => p.path).indexOf('/Users/Andy/miniconda/bin/python').should.be.aboveOrEqual(0)
      brain.pythons.map(p => p.path).indexOf('/usr/local/bin/python').should.be.equal(-1)
      python_usr_bin.should.not.equal(python_default)
      python_other.should.equal(python_default)
      python_other.is_default.should.equal(true)
    });


    it('two pythons - /usr/local/bin/python and default miniconda python', function() {

      class SpawnMock extends BaseSpawnMockBehaviour {
        ls() {
          super.ls()
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
          super.which_python()
          this.result.stdout = '/Users/Andy/miniconda/bin/python'
        }
      }
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Brain} = require('../lib.js')
      let brain = new Brain()
      let python_usr_bin = brain.get_python('/usr/bin/python')
      let python_usr_local_bin = brain.get_python('/usr/local/bin/python')
      let python_other = brain.get_python('/Users/Andy/miniconda/bin/python')
      let python_default = brain.python_default
      brain.pythons.length.should.be.equal(2)
      assert(python_usr_bin == undefined)
      python_other.should.not.be.undefined()
      brain.pythons.map(p => p.path).indexOf('/usr/local/bin/python').should.be.aboveOrEqual(0)
      brain.pythons.map(p => p.path).indexOf('/Users/Andy/miniconda/bin/python').should.be.aboveOrEqual(0)
      brain.pythons.map(p => p.path).indexOf('/usr/bin/python').should.be.equal(-1)
      python_usr_local_bin.should.not.equal(python_default)
      python_other.should.equal(python_default)
      python_other.is_default.should.equal(true)
    });

  });


  describe('miniconda edge cases', function() {

    it('three pythons - /usr/bin/python and /usr/local/bin/python and default miniconda python', function() {

      class SpawnMock extends BaseSpawnMockBehaviour {
        ls() {
          super.ls()
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
          super.which_python()
          this.result.stdout = '/Users/Andy/miniconda/bin/python'
        }
      }
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Brain} = require('../lib.js')
      let brain = new Brain()
      assert(brain.get_python('/usr/bin/python') != undefined)
      assert(brain.get_python('/usr/local/bin/python') != undefined)
      let python_other = brain.get_python('/Users/Andy/miniconda/bin/python')
      let python_default = brain.python_default
      brain.pythons.length.should.be.equal(3)
      python_other.should.not.be.undefined()
      python_other.should.equal(python_default)
      python_other.is_default.should.equal(true)
    });


    it('one python - default miniconda python', function() {

      class SpawnMock extends BaseSpawnMockBehaviour {
        ls() {
          super.ls()
          switch (this.params[1]) {
            case '/usr/bin/python':
              this.select('ls_fail')
              break
            case '/usr/local/bin/python':
              this.select('ls_fail')
              break
          }
        }
        which_python() {
          super.which_python()
          this.result.stdout = '/Users/Andy/miniconda/bin/python'
        }
      }
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Brain} = require('../lib.js')
      let brain = new Brain()
      assert(brain.get_python('/usr/bin/python') == undefined)
      assert(brain.get_python('/usr/local/bin/python') == undefined)
      let python_other = brain.get_python('/Users/Andy/miniconda/bin/python')
      let python_default = brain.python_default
      brain.pythons.length.should.be.equal(1)
      python_other.should.not.be.undefined()
      python_other.should.equal(python_default)
      python_other.is_default.should.equal(true)
    });

  })


  describe('pip default detection via brain', function() {

    it('no pips', function() {

      class SpawnMock extends BaseSpawnMockBehaviour {
        ls() {
          super.ls()
          switch (this.params[1]) {
            case '/usr/bin/pip':
              this.select('ls_fail')
              break
            case '/usr/local/bin/pip':
              this.select('ls_fail')
              break
          }
        }
      }
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Brain} = require('../lib.js')
      let brain = new Brain()
      brain.pips.length.should.be.equal(0)
      assert(brain.get_pip('/usr/local/bin/pip') == undefined)
      assert(brain.pip_default == undefined)
    });


    it('one /usr/local/bin/pip - and it is default', function() {

      class SpawnMock extends BaseSpawnMockBehaviour {
        ls() {
          super.ls()
          switch (this.params[1]) {
            case '/usr/bin/pip':
              this.select('ls_fail')
              break
            case '/usr/local/bin/pip':
              this.select('ls_success')
              break
          }
        }
        which_pip() {
          super.which_python()
          this.result.stdout = '/usr/local/bin/pip'
        }
      }
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Brain} = require('../lib.js')
      let brain = new Brain()
      brain.pips.length.should.be.equal(1)
      brain.get_pip('/usr/local/bin/pip').should.not.be.undefined()
      brain.pip_default.should.not.be.undefined()
      brain.pip_default.should.be.equal(brain.get_pip('/usr/local/bin/pip'))
    });


    it('one /usr/local/bin/pip - and it is not default', function() {

      class SpawnMock extends BaseSpawnMockBehaviour {
        ls() {
          super.ls()
          switch (this.params[1]) {
            case '/usr/bin/pip':
              this.select('ls_fail')
              break
            case '/usr/local/bin/pip':
              this.select('ls_success')
              break
          }
        }
        which_pip() {
          this.select('which_none')
        }
      }
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Brain} = require('../lib.js')
      let brain = new Brain()
      brain.pips.length.should.be.equal(1)
      brain.get_pip('/usr/local/bin/pip').should.not.be.undefined()
      assert(brain.pip_default == undefined)
    });


    it('one /usr/local/bin/pip - plus miniconda pip (default)', function() {

      class SpawnMock extends BaseSpawnMockBehaviour {
        ls() {
          super.ls()
          switch (this.params[1]) {
            case '/usr/bin/pip':
              this.select('ls_fail')
              break
            case '/usr/local/bin/pip':
              this.select('ls_success')
              break
          }
        }
        which_pip() {
          super.which_python()
          this.result.stdout = '/Users/Andy/miniconda/bin/pip'
        }
      }
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Brain} = require('../lib.js')
      let brain = new Brain()
      brain.pips.length.should.be.equal(2)
      brain.get_pip('/usr/local/bin/pip').should.not.be.undefined()
      brain.get_pip('/Users/Andy/miniconda/bin/pip').should.not.be.undefined()
      brain.pip_default.should.not.be.undefined()
      brain.pip_default.should.be.equal(brain.get_pip('/Users/Andy/miniconda/bin/pip'))
    });

  });

})
