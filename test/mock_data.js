function UserException(message) {
   this.message = message;
   this.name = 'UserException';
}

function spawn_result(spawn_result_data) {
  if (spawn_result_data == undefined)
    throw new UserException('trying to build a mock spawn result from undefined data, test data lookup failed?')
  return {
    stdout: spawn_result_data['stdout'],
    stderr: spawn_result_data['stderr'],
    args: [spawn_result_data['cmd'],
           ...spawn_result_data['params']]
  }
}

let spawn_results = {
  'ls_1': {
    'cmd': 'ls',
    'params': ['-lh'],
    'stdout': '     281 /path/cmd',
    'stderr': ''
  },
  'ls_fail': {
    'cmd': 'ls',
    'params': ['-lh'],
    'stdout': '',
    'stderr': 'ls: /path/cmd: No such file or directory'
  },
  'wc_1': {
    'cmd': 'wc',
    'params': ['param1', 'param2'],
    'stdout': '',
    'stderr': 'wc err blah blah'
  },
  'python_version_1': {
    'cmd': 'some/python',
    'params': ['--version'],
    'stdout': '',
    'stderr': '--version err blah blah'
  },
  'python_m_site_1': {
    'cmd': 'some/python',
    'params': ['-m', 'site'],
    'stdout': `
sys.path = [
'path1', 
'path2', 
'/Users/Andy/miniconda/lib/python2.7/site-packages',
]`,
    'stderr': ''
  },
  'python_m_pip_version_1': {
    'cmd': 'some/python',
    'params': ['-m', 'pip', '--version'],
    'stdout': 'pip 9.0.1 from /Users/Andy/miniconda/lib/python2.7/site-packages (python 2.7)',
    'stderr': ''
  },
  'which_python_1': {
    'cmd': 'which',
    'params': ['python'],
    'stdout': '/usr/bin/python',
    'stderr': ''
  },
  'which_python_2': {
    'cmd': 'which',
    'params': ['python'],
    'stdout': '/usr/local/bin/python',
    'stderr': ''
  },
  'stat_1': {
    'cmd': 'stat',
    'params': ['-F', 'some/path'],
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
    this.result = Object.assign({}, spawn_results[key])  // clone
    this.result['cmd'] = this.cmd
    this.result['params'] = this.params
  }

  // Template Pattern - Design Pattern - override any step you want in a sub class e.g. this.ls()

  process_possible_commands() {
    let result

    // console.log(`Mocking "${this.cmd}" with params "${this.params}"`)

    if (this.cmd == 'ls' && this.params[0] == '-lh') {
      this.ls()  // allow sub classes to modify result
      return spawn_result(this.result)  // TODO move 'spawn_result' to be private and part of this class
    }
    // result = this.ls()
    // if (result != undefined)
    //   return result
    //

    result = this.wc()
    if (result != undefined)
      return result

    result = this.version()
    if (result != undefined)
      return result

    result = this.python_m_site()
    if (result != undefined)
      return result

    result = this.pip_version_via_python()
    if (result != undefined)
      return result

    result = this.which_python()
    if (result != undefined)
      return result

    result = this.stat()
    if (result != undefined)
      return result

    throw new UserException(`Unknown case, not sure how to mock "${this.cmd}" with params "${this.params}"`)
  }

  // Util

  // get is_ls() {  // TODO need more flexibility to check the parameter too, and give different results for each
  //   return this.cmd == 'ls'
  // }

  get is_wc() {
    return this.cmd == 'wc'
  }

  get is_version() {
    return (this.params[0] == '--version')  // cmd could be 'python' or 'pip'
  }

  get is_pip_version_via_python() {
    return (this.params[0] == '-m' && this.params[1] == 'pip' && this.params[2] == '--version')
  }

  get is_python_m_site() {
    return (this.params[0] == '-m' && this.params[1] == 'site')
  }

  get is_which_python() {
    return (this.cmd == 'which' && this.params[0] == 'python')
  }

  get is_stat() {  // TODO need more flexibility to check the parameter too, and give different results for each
    return (this.cmd == 'stat' && this.params[0] == '-F')
  }

  // Overridable steps

  ls() {
    this.select('ls_1')
  }

  wc() {
    if (this.is_wc)
      return spawn_result(spawn_results['wc_1'])
  }

  version() {
    if (this.is_version)
      return spawn_result(spawn_results['python_version_1'])
  }

  python_m_site() {
    if (this.is_python_m_site)
      return spawn_result(spawn_results['python_m_site_1'])
  }

  pip_version_via_python() {
    if (this.is_pip_version_via_python)
      return spawn_result(spawn_results['python_m_pip_version_1'])
  }

  which_python() {
    if (this.is_which_python)
      return spawn_result(spawn_results['which_python_1'])
  }

  stat() {
    if (this.is_stat) {
      let result = spawn_results['stat_1']
      result['params'] = this.params
      result['stdout'] = '-rwxr-xr-x 1 root wheel 66576 Dec 13 22:22:22 2017 ' + this.params[1]  // for now just make stat path the exact same as path
      return spawn_result(result)
    }
  }
}

class SpawnMockBehaviourNonExistence extends BaseSpawnMockBehaviour {
  ls() {
    this.select('ls_fail')
  }
}

class SpawnMockBehaviourOnePythonUsrBin extends BaseSpawnMockBehaviour {
  ls() {
    switch (this.params[1]) {
      case '/usr/bin/python':
        this.select('ls_1')
        break
      case '/usr/local/bin/python':
        this.select('ls_fail')
        break
    }
  }

}

exports.BaseSpawnMockBehaviour = BaseSpawnMockBehaviour
exports.SpawnMockBehaviourNonExistence = SpawnMockBehaviourNonExistence
exports.SpawnMockBehaviourOnePythonUsrBin = SpawnMockBehaviourOnePythonUsrBin
exports.spawn_result = spawn_result
exports.spawn_results = spawn_results
exports.UserException = UserException
