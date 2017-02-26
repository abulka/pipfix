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
  'ls_2': {
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
}

class BaseSpawnMockBehaviour{

  constructor(cmd, param_array) {
    this.cmd = cmd
    this.param_array = param_array
  }

  // Template Pattern - Design Pattern - override any step you want in a sub class e.g. this.ls()

  process_possible_commands() {
    let result

    // console.log(`Mocking "${this.cmd}" with params "${this.param_array}"`)

    result = this.ls()
    if (result != undefined)
      return result

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

    throw new UserException(`Unknown case, not sure how to mock "${this.cmd}" with params "${this.param_array}"`)
  }

  // Util

  get is_ls() {
    return this.cmd == 'ls'
  }

  get is_wc() {
    return this.cmd == 'wc'
  }

  get is_version() {
    return (this.param_array[0] == '--version')  // cmd could be 'python' or 'pip'
  }

  get is_pip_version_via_python() {
    return (this.param_array[0] == '-m' && this.param_array[1] == 'pip' && this.param_array[2] == '--version')
  }

  get is_python_m_site() {
    return (this.param_array[0] == '-m' && this.param_array[1] == 'site')
  }

  // Overridable steps

  ls() {
    if (this.is_ls)
      return spawn_result(spawn_results['ls_1'])
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
}

exports.BaseSpawnMockBehaviour = BaseSpawnMockBehaviour
exports.spawn_result = spawn_result
exports.spawn_results = spawn_results
