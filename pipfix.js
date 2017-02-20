'use strict';

let spawn = require( 'child_process' ).spawnSync
// const format = require('fmt-obj')  // https://github.com/queckezz/fmt-obj
const format = require('pretty-format')  // https://github.com/facebook/jest/tree/master/packages/pretty-format
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
    this.report_obj['exists'] = this.exists
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

let python_usr_bin = new Python('/usr/bin/python')
let python_usr_local_bin = new Python('/usr/local/bin/python')
let pip_usr_local_bin = new Pip('/usr/local/bin/pip')
pip_usr_local_bin.inform_about(python_usr_bin)
pip_usr_local_bin.inform_about(python_usr_local_bin)

// TODO need default pip, too
function which_python() {
  let result_shell_which_python = spawn('which', ['python'])
  if (result_shell_which_python.stderr.length == 0) {
    let path = result_shell_which_python.stdout.toString()
    if (path != python_usr_bin.path && path != python_usr_local_bin.path)
      return path.trim()
  }
  return null
}

let path_python_default = which_python()
let python_default
if (path_python_default != null &&
    path_python_default != python_usr_bin.path &&
    path_python_default != python_usr_local_bin.path)
  python_default = new Python(path_python_default)

if (python_default != undefined)
  pip_usr_local_bin.inform_about(python_default)

let pythons = []
pythons.push(python_usr_bin)
pythons.push(python_usr_local_bin)
if (python_default != undefined)
  pythons.push(python_default)

// report

python_usr_bin.report()
python_usr_local_bin.report()
if (python_default != undefined)
  python_default.report()
pip_usr_local_bin.report()
let report = {
  '1st Python': python_usr_bin.report_obj,
  '2nd Python': python_usr_local_bin.report_obj,
  'Pip': pip_usr_local_bin.report_obj
}
// console.log(format(report))

console.log('1st Python')
console.log('----------', format(python_usr_bin.report_obj))
// console.log(format(python_usr_bin.report_obj))
console.log('')
console.log('2nd Python')
console.log('----------', format(python_usr_local_bin.report_obj))
// console.log(format(python_usr_local_bin.report_obj))
console.log('')

if (python_default != undefined) {
  console.log('Default Python')
  console.log('----------', format(python_default.report_obj))
  console.log('')
}

console.log('Pip')
console.log('---', format(pip_usr_local_bin.report_obj))
// console.log(format(pip_usr_local_bin.report_obj))
console.log('')

function advice() {
  console.log('Recommendations', `(${pythons.length} pythons found)`)
  console.log('---------------')
  const tab = '   - '
  for (let python of pythons) {
    console.log(`${python.path}`)
    if (! python.exists) {
      console.log(`${tab}not installed, install via brew or python.org installer`)
      console.log('')
      continue
    }
    if (python.pip_module_version == undefined) {
      console.log(`${tab}has no pip`)
      // Possible values are: 'darwin', 'freebsd', 'linux', 'sunos' or 'win32'
      if (process.platform == 'darwin') {
        if (python.path == '/usr/bin/python') {
          console.log(`${tab}try "sudo easy_install pip" which puts pip into "/usr/local/bin"`)
          if (pip_usr_local_bin.exists)
            console.log(`${tab}warning: another pip already exists there, so perhaps rename the old ${pip_usr_local_bin.path}sys`)
        }
      }
    }
    else
      console.log(`${tab}ok`)

  console.log('')
  }

  for (let pip of [pip_usr_local_bin]) {
    console.log(`${pip.path}`)
    if (pip.runs_ok && pip.size == 0) {
      console.log(`${tab}pip exists but somehow is 0 bytes !?, try to uninstall and reinstall ${pip_usr_local_bin.path}.`)
      console.log(`  ${tab}If its brew pip then "brew install pip".`)
      console.log(`  ${tab}If its python.org's python 2.7.13 which comes with pip try a full uninstall & re-install`)
      console.log(`  ${tab}If its python.org's earlier version of python 2, then perhaps "/usr/local/bin/python -m ensurepip"`)
    }
    else if (! pip.exists)
      console.log(`${tab}pip missing, install it`)
    else
      console.log(`${tab}ok`)

  console.log('')
  }
}

advice()
console.log('DONE ')
