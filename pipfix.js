'use strict';

let spawn = require( 'child_process' ).spawnSync

function prt(cmd) {
  if (cmd.stderr != null && cmd.stderr.length != 0)
    console.log(`stderr: ${cmd.stderr.toString()}`)
  if (cmd.stdout != null && cmd.stdout.length != 0)
    console.log(`stdout: ${cmd.stdout.toString()}`)
}

console.log('--------')


class Base {
  constructor(path) {
    this.path = path
    this.result_shell_ls
    this.result_shell_version
    this.version
    this.warnings = []
    this.accept_stderr_msg_as_valid_for_version = false
  }

  get exists() {
    return this.valid(this.result_shell_ls)
  }

  get runs_ok() {
    return this.valid(this.result_shell_version,
                      this.accept_stderr_msg_as_valid_for_version)
  }

  valid(result_shell_obj, accept_stderr_msg_as_valid=false) {
    if (accept_stderr_msg_as_valid &&
        result_shell_obj.stderr != null &&
        result_shell_obj.stderr.length > 0)
      return true

    if (result_shell_obj.stderr != null &&
      result_shell_obj.stderr.length == 0)
      return true

    return false
  }

  analyse() {
    this.result_shell_ls = spawn('ls', ['-lh', this.path])
    this.result_shell_version = spawn(this.path, ['--version'])

    if (this.exists && this.runs_ok) {
      this.analyse_version()
      if (this.version == undefined) this.warnings.push(`${this.path} exists but version could not be determined`)
    }

    if (! this.exists) this.warnings.push(`${this.path} executable doesn't exist`)
    if (this.exists && ! this.runs_ok) this.warnings.push(`${this.path} doesn't run properly`)
  }

  report() {
    console.log(`${this.path} exists: ${this.exists}`)
    console.log(`${this.path} runs ok: ${this.runs_ok}`)
    console.log(`${this.path} version: ${this.version}`)

    if (this.warnings.length > 0) {
      for (let warning of this.warnings)
        console.log(`Warning: ${warning}`)
      // if verbose
      prt(this.result_shell_ls)
      prt(this.result_shell_version)
    }
  }

}

let sys_path  // can we make this non global?

class Python extends Base {
  constructor(path) {
    super(path)
    this.accept_stderr_msg_as_valid_for_version = true  // cope with python 2 bug which reports python version via stderr rather than stdout
    this.result_shell_site_info
    this.site_package_paths = []
    this.analyse()
  }

  analyse() {
    super.analyse()
    this.result_shell_site_info = spawn( this.path, [ '-m', 'site' ] )
    this.parse_site_info()
  }

  analyse_version() {
    const regex = /Python (.*)/

    let match = regex.exec(this.result_shell_version.stderr.toString())  // note: python 2 reports python version via stderr rather than stdout
    if (match != null)
      this.version = match[1]
  }

  parse_site_info() {
    if (! this.valid(this.result_shell_site_info))
      return

    let line = ''
    let scan = false
    let sys_path_str = 'var sys_path = '
    let chunk = ''
    let stdout = this.result_shell_site_info.stdout.toString()
    let lines = stdout.split("\n")

    for (let line of lines) {
      if (line == 'sys.path = [') {
        scan = true
        continue
      }
      if (scan)
        chunk = chunk + line
      if (line == ']')
        scan = false
    }
    chunk = 'sys_path = [' + chunk
    eval(chunk)
  }

  report() {
    super.report()
    if (this.runs_ok)
      console.log(`${this.path} sys_path: ${sys_path.length} entries`)
  }
}

class Pip extends Base {
  constructor(path) {
    super(path);
    this.site_package_path
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

  report() {
    super.report()
    console.log(`${this.path} site_package_path: ${this.site_package_path}`)
  }
}

let pip_usr_local_bin = new Pip('/usr/local/bin/pip')
let python_usr_bin = new Python('/usr/bin/python')

python_usr_bin.report()
console.log()
pip_usr_local_bin.report()
console.log()

let pip_in_site = sys_path.indexOf(pip_usr_local_bin.site_package_path) >= 0
console.log(`${pip_usr_local_bin.path} associated with mac system python? ${pip_in_site}`)
console.log()

// this alters the global 'sys_path' - BAD - need to make sys_path a local to each python instance
sys_path = []
let python_usr_local_bin = new Python('/usr/local/bin/python')
python_usr_local_bin.report()
if (sys_path.length > 0) {
  pip_in_site = sys_path.indexOf(pip_usr_local_bin.site_package_path) >= 0
  console.log(`${pip_usr_local_bin.path} associated with OTHER python (if any)? ${pip_in_site}`)
}

console.log('DONE ')
