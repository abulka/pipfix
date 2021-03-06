var assert = require('assert');     // https://nodejs.org/api/assert.html
var should = require('should');     // https://github.com/shouldjs/should.js
var sinon = require('sinon');       // https://www.sitepoint.com/sinon-tutorial-javascript-testing-mocks-spies-stubs/
var mockery = require('mockery');   // https://github.com/mfncooper/mockery
var {BaseSpawnMockBehaviour, make_mock_spawn_func, SPAWN_RESULTS} = require('./mock_data.js')

describe('detection of one or more pip and python', function() {

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

  describe('python existence', function() {

    it('brain finds no pythons', function() {
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
          this.select('which_none')
        }
      }
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Brain} = require('../lib.js')
      let brain = new Brain()
      brain.analyse_relationships()
      brain.pythons.length.should.equal(0)
    });


    it('brain finds /usr/bin python only', function() {

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
          this.select('which_none')
        }
      }
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Brain} = require('../lib.js')
      let brain = new Brain()
      brain.analyse_relationships()
      brain.pythons.length.should.equal(1)
    })


    it('brain finds /usr/local/bin python only', function() {

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
          this.select('which_none')
        }
      }
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Brain} = require('../lib.js')
      let brain = new Brain()
      brain.analyse_relationships()
      brain.pythons.length.should.equal(1)
    })


    it('brain finds both /usr/bin and /usr/local/bin python', function() {

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
          this.select('which_none')
        }
      }
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Brain} = require('../lib.js')
      let brain = new Brain()
      brain.analyse_relationships()
      brain.pythons.length.should.equal(2)
    })


    it('brain finds three pythons - /usr/bin and /usr/local/bin python and extra default python', function() {

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
      brain.analyse_relationships()
      brain.pythons.length.should.equal(3)
    })

  })

  describe('pip existence', function() {

    it('brain finds no pips', function() {

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
        which_pip() {
          this.select('which_none')
        }
      }
      mockery.registerMock('child_process', { spawnSync: make_mock_spawn_func(SpawnMock) })
      let {Brain} = require('../lib.js')
      let brain = new Brain()
      brain.analyse_relationships()
      brain.pips.length.should.equal(0)
    });


    it('brain finds /usr/local/bin/pip', function() {

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
      brain.analyse_relationships()
      brain.pips.length.should.equal(1)
    });


    it('brain finds /usr/local/bin/pip plus another default pip', function() {

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
      brain.analyse_relationships()
      brain.pips.length.should.equal(2)
    });

  });

})

