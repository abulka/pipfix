'use strict';

let spawn = require( 'child_process' ).spawnSync
let {UserException} = require('./util.js')

const SIMPLE_WARNINGS = true

function cmd_was_run(cmd) {
  return (cmd.stderr != null &&
          cmd.stdout != null )
}

function prt(cmd, verbose=true) {
  let result = {}

  result.command = cmd.args.join(' ')

  if (cmd_was_run(cmd)) {
    result.stderr = cmd.stderr.toString().trim()
    result.stdout = cmd.stdout.toString().trim()
  }
  else {
    result.note = 'not run'
  }
  return result
}


class Base {
  constructor(path) {
    this.path = path
    this.is_default = false
    this.result_shell_ls
    this.result_shell_version
    this.result_shell_file_size
    this.version
    this.size
    this.warnings = []
    this.interpret_stderr_as_stdout_for_getting_version_info = false  // subclass to set if needed
    this.report_obj = {}
  }

  get exists() {
    return this.valid(this.result_shell_ls)
  }

  get runs_ok() {
    return this.valid(this.result_shell_version)
  }

  valid(result_shell_obj) {
    if (! cmd_was_run(result_shell_obj))
      return false

    let accept_stderr_msg_as_valid = result_shell_obj.args[1] == "--version" &&
                                     this.interpret_stderr_as_stdout_for_getting_version_info

    if (accept_stderr_msg_as_valid)
      return result_shell_obj.stderr.length > 0
    else
      return result_shell_obj.stderr.length == 0
  }

  analyse_is_exe_empty() {
    const regex = /^\s+(\d+)\s{1}\//

    let match = regex.exec(this.result_shell_file_size.stdout.toString())  // match things like "     281 /usr/local/bin/pip"
    if (match != null)
      this.size = parseInt(match[1])
  }

  analyse() {
    this.result_shell_ls = spawn('ls', ['-lh', this.path])
    this.result_shell_version = spawn(this.path, ['--version'])
    this.result_shell_file_size = spawn('wc', ['-c', this.path])

    if (this.exists) {
      this.analyse_is_exe_empty()
      this.analyse_version()  // template pattern - method declared in subclass

      if (this.version == undefined) this.add_warning(`version could not be determined`, this.result_shell_version)
      if (this.size == undefined) this.add_warning(`could not determine file size`, this.result_shell_file_size)
      if (this.size == 0) this.add_warning(`executable file exists but is empty?`,
                                              [this.result_shell_ls, this.result_shell_file_size])
    }
    if (this.exists && ! this.runs_ok) this.add_warning(`${this.path} doesn't run properly`,
                                              [this.result_shell_ls, this.result_shell_version])
  }

  add_warning(message, shell_results=[]) {
    // console.log('adding warning', message, 'this.report_line=', this.report_line)
    if (SIMPLE_WARNINGS) {
      this.warnings.push(message)
    }
    else {
      let warning = {}

      if (! Array.isArray(shell_results))
        shell_results = [shell_results]

      warning.reason = message

      if (shell_results.length > 0) {
        if (warning['shell results'] == undefined)
          warning['shell results'] = []

        for (let result of shell_results) {
          let shell_result = prt(result)
          warning['shell results'].push(shell_result)
        }

      this.warnings.push(warning)
      }
    }
  }

  report() {
    this.report_obj = {}
    this.report_obj.path = this.path
    // this.report_obj['exists'] = this.exists
    this.report_obj.is_default = this.is_default
    if (this.exists) {
      this.report_obj.runs_ok = this.runs_ok
      this.report_obj.version = this.version
    }
    if (this.warnings.length > 0)
      this.report_obj.warnings = this.warnings
  }
}

class Python extends Base {
  constructor(path) {
    super(path)
    this.interpret_stderr_as_stdout_for_getting_version_info = true  // cope with python 2 bug which reports python version via stderr rather than stdout
    this.result_shell_site_info
    this.result_shell_run_pip_as_module
    this.sys_path = []
    this.pip_module_version
    this.pip_module_site_package_path
    this.analyse()
  }

  analyse() {
    super.analyse()

    // why run these if this python doesn't exist?
    this.result_shell_site_info = spawn( this.path, [ '-m', 'site' ] )
    this.result_shell_run_pip_as_module = spawn( this.path, [ '-m', 'pip', '--version' ] )
    // why analyse these if this python doesn't exist?
    this.analyse_site_info()
    this.analyse_pip_version()
  }

  analyse_version() {
    const regex = /Python (.*)/

    let match = regex.exec(this.result_shell_version.stderr.toString())  // note: python 2 reports python version via stderr rather than stdout
    if (match != null)
      this.version = match[1]
  }

  analyse_site_info() {
    if (! this.valid(this.result_shell_site_info))
      return

    let lines = this.result_shell_site_info.stdout.toString().split("\n")
    let scan = false
    let chunk = ''

    for (let line of lines) {
      if (line == 'sys.path = [') {
        chunk = '['
        scan = true
        continue
      }
      if (scan)
        chunk += line
      if (line == ']')
        scan = false
    }

    function eval_local(chunk){
      "use strict"
      // console.log(`chunk is "${chunk}"`)
      let sys_path = eval(`let x = ${chunk} ; x`);
      return sys_path
    }

    this.sys_path = eval_local(chunk)  // idea from http://stackoverflow.com/questions/9781285/specify-scope-for-eval-in-javascript
  }

  analyse_pip_version() {
    const regex = /pip (.*) from (.*)\/site-packages/   // TODO move to base class - or even this whole method.

    if (! this.exists)
      return

    if (this.result_shell_run_pip_as_module.stderr.length > 0) {
      this.add_warning(`pip module not installed`, this.result_shell_run_pip_as_module)
      return
    }

    let match = regex.exec(this.result_shell_run_pip_as_module.stdout.toString())
    if (match != null) {
      this.pip_module_version = match[1]
      this.pip_module_site_package_path = match[2] + '/site-packages'
    }
    if (this.pip_module_version == undefined) this.add_warning(`pip module not installed`, this.result_shell_run_pip_as_module)
  }

  report() {
    super.report()
    if (this.runs_ok) {
      this.report_obj['sys.path'] = `${this.sys_path.length} entries`

      this.report_obj.pip = {}
      this.report_obj.pip.installed = this.pip_module_version != undefined
      this.report_obj.pip.version = this.pip_module_version
      this.report_obj.pip.site = this.pip_module_site_package_path
    }
  }
}

class Pip extends Base {
  constructor(path) {
    super(path);
    this.site_package_path
    this.pythons = []
    this.analyse()
  }

  analyse() {
    super.analyse()
  }

  analyse_version() {
    const regex = /pip (.*) from (.*)\/site-packages/
    // const regex2 = /^\/Library\//

    let match = regex.exec(this.result_shell_version.stdout.toString())
    if (match != null) {
      this.version = match[1]
      this.site_package_path = match[2] + '/site-packages'
    }

    // The directory
    //   /Library/Python/2.7/site-packages
    // used to be used by both system python AND python org python
    // but as of python 2.7.13 is only used by mac system python - NOT python org python anymore cos of incompatibilities
    //
    // let match2 = regex2.exec(this.site_package_path)
    // this.site_package_path_is_non_system_python = (match != null) {
  }

  inform_about(python) {
    this.pythons.push(python)
  }

  report() {
    super.report()
    this.report_obj.site = this.site_package_path

    this.report_obj.associations = {}
    for (let python of this.pythons) {
      let pip_and_python_share_a_site = false
      if (! python.exists)
        pip_and_python_share_a_site = 'N/A'
      else
        pip_and_python_share_a_site = python.sys_path.length > 0 && python.sys_path.indexOf(this.site_package_path) >= 0
      this.report_obj.associations[python.path] = pip_and_python_share_a_site
    }
  }
}


class Brain {
  constructor() {
    this.pythons = []
    this.pips = []
    this.python_default
    this.pip_default

    this.find_python('/usr/bin/python')
    this.find_python('/usr/local/bin/python')
    this.python_default = this.find_default('python', this.pythons, Python)

    this.find_pip('/usr/bin/pip')
    this.find_pip('/usr/local/bin/pip')
    this.pip_default = this.find_default('pip', this.pips, Pip)

    this.analyse_relationships()  // inform all pips of all other pythons
    this.report()
  }

  report() {
    for (let python of this.pythons)
      python.report()
    for (let pip of this.pips)
      pip.report()
  }

  find_python(path) {
    let python = new Python(path)
    if (python.exists)
      this.pythons.push(python)
  }

  find_pip(path) {
    let pip = new Pip(path)
    if (pip.exists)
      this.pips.push(pip)
  }

  find_default(cmd, collection, Class) {
    /*
     Find default python or pip, add it to the collection.  If its not already in the collection, then
     create an instance of 'Class' and add it.
     Parameters:
       'cmd' is e.g. 'python' or 'pip'
       'collection' is e.g. this.pythons or this.pips
       'Class' is Python or Pip class
     Returns:
       The Python or Pip instance which is the default, which you should assign to this.python_default or this.pip_default
     */
    let result_shell_which = spawn('which', [cmd])
    if (result_shell_which.stderr.length != 0)
      throw new UserException(`which ${cmd} failed with error "${result_shell_which.stderr.toString()}" thus cannot determine default ${cmd}`)
    let path_default = result_shell_which.stdout.toString().trim()

    if (path_default == '')  // 'which python' command found no default python
      return undefined

    for (let el of collection)
      if (this.paths_same(path_default, el.path)) {
        // this.python_default = el
        el.is_default = true
        return el  // default python pip is an existing one
      }
    let another = new Class(path_default)
    collection.push(another)  // default python is a totally new python we found e.g. miniconda
    another.is_default = true
    return another
  }

  paths_same(path1, path2) {
    // See if the paths are the same.
    // Also check against the 'stat' version of path2, just in case its a symbolic link

    if (path1 == path2)
      return true

    let path2_symbolic = this.symbolic_path(path2)
    if (path2_symbolic != undefined && (path2_symbolic.indexOf(path1) != -1))
      return true

    return false
  }

  symbolic_path(path) {
    // get the real underlying path
    let result_shell_stat = spawn('stat', ['-F', path])
    if (result_shell_stat.stderr.length != 0)
      throw new UserException(`"stat" failed with error "${result_shell_stat.stderr.toString()}" thus cannot determine symbolic link behind "${path}"`)

    let symbolic_path = result_shell_stat.stdout.toString()  // TODO parse this properly and get the pure absolute path
    return symbolic_path
  }

  get_python(path) {
    for (let python of this.pythons)
      if (path == python.path)
        return python
    return undefined
  }

  get_pip(path) {
    for (let pip of this.pips)
      if (path == pip.path)
        return pip
    return undefined
  }

  analyse_relationships() {
    // inform all pips of all other pythons
    for (let pip of this.pips)
      for (let python of this.pythons)
        pip.inform_about(python)
  }
}

exports.Python = Python
exports.Pip = Pip
exports.Brain = Brain
