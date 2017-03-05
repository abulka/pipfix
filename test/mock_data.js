/*
  Mock Spawn.

  Usually you:
  ------------
    let spawn = require( 'child_process' ).spawnSync

    this.result_shell_ls = spawn('ls', ['-lh', this.path])

  where the result looks like

      args: [cmd, param1, param2, ...]
      stdout: '...',
      stderr: '...',

  To Mock simply:
  ---------------
    mockery.registerMock('child_process', {
      spawnSync: function(cmd, param_array) {
        return (new BaseSpawnMockBehaviour(cmd, param_array)).process_possible_commands()
      }
    })
    let {Python, Pip, Which} = require('../lib.js')

  What this does is replace the 'child_process' module with our own 'spawnSync' key/function, which
  we have told to return a fake result object, via

    (new BaseSpawnMockBehaviour(cmd, param_array)).process_possible_commands()

  which looks like a complex thing, but it simply creates a class and calls '.process_possible_commands()'
 */

var assert = require('assert');     // https://nodejs.org/api/assert.html
let {UserException} = require('../util.js')

const SPAWN_RESULTS = {
  "ls_success": {  // ls -lh some/path
    'stdout': '     281 /path/cmd',
    'stderr': ''
  },
  'ls_fail': {  // ls -lh some/path
    'stdout': '',
    'stderr': 'ls: /path/cmd: No such file or directory'
  },
  "wc_fail": {  // wc ....
    'stdout': '',
    'stderr': 'wc err blah blah'
  },
  "cmd_version_fail": {  // some/cmd --version
    'stdout': '',
    'stderr': '--version err blah blah'
  },
  'python_m_site_1': {  // some/python -m site
    'stdout': `
sys.path = [
'path1', 
'path2', 
'/Users/Andy/miniconda/lib/python2.7/site-packages',
]`,
    'stderr': ''
  },
  'python_m_pip_version_1': {  // some/python -m pip --version
    'stdout': 'pip 9.0.1 from /Users/Andy/miniconda/lib/python2.7/site-packages (python 2.7)',
    'stderr': ''
  },
  "which_none": {  // which python or pip
    'stdout': '',
    'stderr': ''
  },
  "which_python_usr_bin": {  // which python
    'stdout': '/usr/bin/python',
    'stderr': ''
  },
  "which_python_usr_local_bin": {  // which python
    'stdout': '/usr/local/bin/python',
    'stderr': ''
  },
  "which_pip_usr_local_bin": {  // which pip
    'stdout': '/usr/local/bin/pip',
    'stderr': ''
  },
  'stat_1': {  // stat -F some/path
    'stdout': '/usr/bin/python',
    'stderr': ''
  },
}

class BaseSpawnMockBehaviour{

  constructor(cmd, params) {
    this.cmd = cmd
    this.params = params
    this.result
  }

  select(key) {
    // Select a mock result from the data structure of possibilities found in 'SPAWN_RESULTS'
    this.result = Object.assign({}, SPAWN_RESULTS[key])  // clone
    this.result['cmd'] = this.cmd
    this.result['params'] = this.params
  }

  spawn_result() {
    // Convert the json test result data into an object that looks exactly like what spawn returns
    if (this.result == undefined)
      throw new UserException('Trying to build a mock spawn result from undefined data.')
    return {
      stdout: this.result['stdout'],
      stderr: this.result['stderr'],
      args: [this.result['cmd'],
             ...this.result['params']]
    }
  }

  // Template Pattern - Design Pattern - override any step you want in a sub class e.g. this.ls()

  process_possible_commands() {
    // console.log(`Mocking "${this.cmd}" with params "${this.params}"`)

    if (this.cmd == 'ls' && this.params[0] == '-lh')
      this.ls()
    else if (this.cmd == 'wc')
      this.wc()
    else if (this.params[0] == '--version')  // cmd could be 'python' or 'pip'
      this.version()
    else if (this.params[0] == '-m' && this.params[1] == 'pip' && this.params[2] == '--version')
      this.pip_version_via_python()
    else if (this.params[0] == '-m' && this.params[1] == 'site')
      this.python_m_site()
    else if (this.cmd == 'which' && this.params[0] == 'python')
      this.which_python()
    else if (this.cmd == 'which' && this.params[0] == 'pip')
      this.which_pip()
    else if (this.cmd == 'stat' && this.params[0] == '-F')
      this.stat()
    else
      throw new UserException(`Unknown Spawn case, not sure how to mock "${this.cmd}" with params "${this.params}"`)

    return this.spawn_result()
  }

  // Default results, individual methods can be overridden by subclasses to suit the test case

  ls() {
    this.select('ls_fail')
    assert(this.result != undefined)
  }

  wc() {
    this.select('wc_fail')
    assert(this.result != undefined)
  }

  version() {
    this.select('cmd_version_fail')
    assert(this.result != undefined)
  }

  python_m_site() {
    this.select('python_m_site_1')
    assert(this.result != undefined)
  }

  pip_version_via_python() {
    this.select('python_m_pip_version_1')
    assert(this.result != undefined)
  }

  which_python() {
    this.select('which_none')
    assert(this.result != undefined)
  }

  which_pip() {
    this.select('which_none')
    assert(this.result != undefined)
  }

  stat() {
    this.select('stat_1')
    this.result['stdout'] = '-rwxr-xr-x 1 root wheel 66576 Dec 13 22:22:22 2017 ' + this.params[1]  // for now just make stat path the exact same as path
    assert(this.result != undefined)
  }
}

function make_mock_spawn_func(HelperClass) {
  /*
   Returns mock version of 'spawn' function acting in accordance with the mocking logic within 'HelperClass'
   Note: closure technology in use - returns a function 'my_spawn' closed over 'HelperClass'
   but which takes 'cmd', 'param_array' as params, just like the real spawn and spawnSync do.
   */
  function my_spawn(cmd, param_array) {
    let o = new HelperClass(cmd, param_array)
    return o.process_possible_commands()
  }
  return my_spawn
}

exports.BaseSpawnMockBehaviour = BaseSpawnMockBehaviour
exports.make_mock_spawn_func = make_mock_spawn_func
exports.SPAWN_RESULTS = SPAWN_RESULTS
