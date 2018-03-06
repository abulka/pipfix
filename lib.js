'use strict';

let glob = require("glob")
let spawn = require( 'child_process' ).spawnSync
const {run_async} = require('./run_async.js')
let {UserException} = require('./util.js')

const SIMPLE_WARNINGS = true

function cmd_was_run(result_shell_obj) {
  // if command was truly run, then stdout and stderr would be arrays, not null
  return (result_shell_obj.stderr != null && result_shell_obj.stdout != null )
}

function cmd_had_error(result_shell_obj) {
  // stderr triggered
  // return (result_shell_obj.status != 0 || result_shell_obj.stderr.length > 0)  // TODO mock up the status for tests
  return (result_shell_obj.stderr.length > 0)
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

function spawn_xtra(cmd, arg_list) {
  // Enhanced spawn, puts back undocumented .args property which disappeared somewhere in between node 7 and node 9
  // Usage: same as spawn e.g. spawn_xtra('ls', ['-lh', '/'])
  let result_shell_obj = spawn(cmd, arg_list)
  if (result_shell_obj.args == undefined) {
    arg_list.splice(0, 0, cmd)  // arg_list.insert(0, cmd) 
    result_shell_obj.args = arg_list
  }
  //result_shell_obj.cmd = cmd
  return result_shell_obj
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
    // based on running 'ls' of the file
    return this.result_shell_ls != undefined && cmd_was_run(this.result_shell_ls) && ! cmd_had_error(this.result_shell_ls)
  }

  get runs_ok() {
    // based on running '--version' on the file. We don't call cmd_had_error() because of Python idiosyncrasy of reporting version in stderr, 
    // so we instead check if version was extracted successfully - which should always be possible if the command ran ok
    return this.result_shell_version != undefined && cmd_was_run(this.result_shell_version) && this.version != undefined
  }

  analyse() {
    this.result_shell_ls = spawn_xtra('ls', ['-lh', this.path])
    if (this.exists) {
      this.result_shell_version = spawn_xtra(this.path, ['--version'])
      this.result_shell_file_size = spawn_xtra('wc', ['-c', this.path])
    }

    // console.log(`Base analyse() for ${this.path} ls stderr "${this.result_shell_ls.stderr.toString()}" version stderr "${this.result_shell_version.stderr.toString()}"`)

    if (this.exists) {
      this.analyse_size()
      this.analyse_version()  // template pattern - method declared in subclass

      if (this.version == undefined)
        this.add_warning(`version could not be determined`, this.result_shell_version)
      if (this.size == undefined)
        this.add_warning(`could not determine file size`, this.result_shell_file_size)
      if (this.size == 0) 
        this.add_warning(`executable file exists but is empty?`, [this.result_shell_ls, this.result_shell_file_size])
    }
    if (this.exists && ! this.runs_ok) 
      this.add_warning(`${this.path} doesn't run properly`, [this.result_shell_ls, this.result_shell_version])
  }

  analyse_size() {
    const regex = /^\s+(\d+)\s{1}\//

    let match = regex.exec(this.result_shell_file_size.stdout.toString())  // match things like "     281 /usr/local/bin/pip"
    if (match != null)
      this.size = parseInt(match[1])
  }

  analyse_version() {} // Subclasses should override and set 'this.version'

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

    // this python doesn't exist or we can't run it properly and determine its version
    if (! this.exists || ! this.runs_ok)
      return

    this.result_shell_site_info = spawn_xtra( this.path, [ '-m', 'site' ] )
    this.result_shell_run_pip_as_module = spawn_xtra( this.path, [ '-m', 'pip', '--version' ] )
    this.analyse_site_info()
    this.analyse_pip_version()
  }

  analyse_version() {
    const regex = /^Python (.*)/

    let match = regex.exec(this.result_shell_version.stderr.toString())  // note: python 2 and python < 3.4 reports python version via stderr rather than stdout
    if (match != null)
      this.version = match[1]
    else {
      // try again with stdout
      match = regex.exec(this.result_shell_version.stdout.toString())
      if (match != null)
        this.version = match[1]
    }
  }

  analyse_site_info() {
    let valid = cmd_was_run(this.result_shell_ls) && ! cmd_had_error(this.result_shell_ls)
    if (! valid)
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
    this.site_relationships = {}  // hash where keys are python paths, values are boolean
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

    // Figure out if pip and this python share a site
    this.site_relationships[python.path] = python.sys_path.length > 0 && python.sys_path.indexOf(this.site_package_path) >= 0
  }

  report() {
    super.report()
    this.report_obj.site = this.site_package_path
    this.report_obj.site_relationships = this.site_relationships  // TODO rename 'associations' to 'site_relationships'
  }
}


class Brain {
  constructor() {
    this.pythons = []
    this.pips = []
    this.python_default
    this.pip_default
    this.visualisation = ''

    this.find_python('/usr/bin/python')
    this.find_python('/usr/local/bin/python')
    this.find_python('/usr/local/bin/python3')
    for (let file_path of glob.sync("/usr/local/Cellar/python*/*/bin/python?"))
      this.find_python(file_path)
    this.python_default = this.find_default('python', this.pythons, Python)
    this.python_default = this.find_default('python2', this.pythons, Python)
    this.python_default = this.find_default('python3', this.pythons, Python)

    this.find_pip('/usr/bin/pip')
    this.find_pip('/usr/local/bin/pip')
    this.find_pip('/usr/local/bin/pip2')
    this.find_pip('/usr/local/bin/pip3')
    for (let file_path of glob.sync("/usr/local/Cellar/python*/*/bin/pip?"))
      this.find_pip(file_path)
    this.pip_default = this.find_default('pip', this.pips, Pip)
    this.pip_default = this.find_default('pip2', this.pips, Pip)
    this.pip_default = this.find_default('pip3', this.pips, Pip)

    this.analyse_relationships()  // inform all pips of all other pythons
    this.report()
    this.visualise()
  }

  report() {
    for (let python of this.pythons)
      python.report()
    for (let pip of this.pips)
      pip.report()
  }

  visualise() {
    // let sites = []
    let sites = ''
    let result = ''
    let s
    for (let python of this.pythons) {
      result += `  "${python.path}" -> "${python.pip_module_site_package_path}" [style=dotted];\n`
      sites += `  "${python.pip_module_site_package_path}" [shape=box];\n`  // todo should put into a set and not repeat
    }
    for (let pip of this.pips) {
      result += `  "${pip.path}" -> "${pip.site_package_path}" [style=dotted];\n`
      sites += `  "${pip.site_package_path}" [shape=box];\n`  // todo should put into a set and not repeat

      let relationship
      Object.keys(pip.site_relationships).forEach( key => {
        if (pip.site_relationships[key])
          result += `  "${pip.path}" -> "${key}" [color=blue];\n`  // pip to python relationship
      });

    }
    this.visualisation = `digraph G {\n${sites}\n${result}\n}`
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
    let result_shell_which = spawn_xtra('which', [cmd])
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
    let result_shell_stat = spawn_xtra('stat', ['-F', path])
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
