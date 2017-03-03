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
  "python_version_fail": {  // some/python --version
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
  "which_python_usr_bin": {  // which python
    'stdout': '/usr/bin/python',
    'stderr': ''
  },
  "which_python_usr_local_bin": {  // which python
    'stdout': '/usr/local/bin/python',
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
    else if (this.cmd == 'stat' && this.params[0] == '-F')
      this.stat()
    else
      throw new UserException(`Unknown Spawn case, not sure how to mock "${this.cmd}" with params "${this.params}"`)

    return this.spawn_result()
  }

  // Default results, individual methods can be overridden by subclasses to suit the test case

  ls() {
    this.select('ls_success')
  }

  wc() {
    this.select('wc_fail')
  }

  version() {
    this.select('python_version_fail')
  }

  python_m_site() {
    this.select('python_m_site_1')
  }

  pip_version_via_python() {
    this.select('python_m_pip_version_1')
  }

  which_python() {
    this.select('which_python_usr_bin')
  }

  stat() {
    this.select('stat_1')
    this.result['stdout'] = '-rwxr-xr-x 1 root wheel 66576 Dec 13 22:22:22 2017 ' + this.params[1]  // for now just make stat path the exact same as path
  }
}

exports.BaseSpawnMockBehaviour = BaseSpawnMockBehaviour
exports.SPAWN_RESULTS = SPAWN_RESULTS
