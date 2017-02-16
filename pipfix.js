'use strict';

// DEBUG http://stackoverflow.com/questions/27688804/how-do-i-debug-error-spawn-enoent-on-node-js
//
// (function() {
//     var childProcess = require("child_process");
//     var oldSpawn = childProcess.spawnSync;
//     function mySpawn() {
//         console.log('spawn called');
//         console.log(arguments);
//         var result = oldSpawn.apply(this, arguments);
//         return result;
//     }
//     childProcess.spawnSync = mySpawn;
// })();

let spawn = require( 'child_process' ).spawnSync

// let python_usr_bin = spawn( 'ls', [ '-lh', '/usr/bin/python' ] )
// let python_usr_bin_version = spawn( '/usr/bin/python', [ '--version'] )
// let python_usr_local_bin = spawn( 'ls', [ '-lh', '/usr/local/bin/python' ] )
// let pip_usr_local_bin = spawn( 'ls', [ '-lh', '/usr/local/bin/pip' ] )
// let pip_usr_local_bin_version = spawn( '/usr/local/bin/pip', [ '--version' ] )
// let python_usr_bin_site = spawn( '/usr/bin/python', [ '-m', 'site' ] )
// prt(python_usr_bin_site)
//
// let ppp = spawn( 'ls', [ '-lh', '/usr/local/bin/pip' ] )
// prt(ppp)

// let info

function prt(cmd) {
  if (cmd.stderr != null && cmd.stderr.length != 0)
    console.log(`stderr: ${cmd.stderr.toString()}`)
  if (cmd.stdout != null && cmd.stdout.length != 0)
    console.log(`stdout: ${cmd.stdout.toString()}`)
}

console.log('--------')

// console.log( `stderr: ${ls.stderr.toString()}` );
// console.log( `stdout: ${ls.stdout.toString()}` );

// info = 'System Mac python'
// if (python_usr_bin.stderr.length == 0) {
//   console.log(`${info} exists OK: ${python_usr_bin.stdout.toString()}`)
//   console.log(`${info} version: ${python_usr_bin_version.stderr.toString()}`)  // bug in python 2.7 puts this info in stderr instead of stdout
// }
// else
//   console.log(`${info} missing?: ${python_usr_bin.stderr.toString()}`)
//
// info = 'Python Org or Brew python'
// if (python_usr_local_bin.stderr.length == 0)
//   console.log(`${info} exists OK: ${python_usr_local_bin.stdout.toString()}`)
// else
//   console.log(`${info} not installed in /usr/local/bin\n`)

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
    // console.log('--- exists --')
    // // console.log('this.result_shell_ls', this.result_shell_ls)
    // // console.log('this.result_shell_version', this.result_shell_version)
    // prt(this.result_shell_ls)
    // prt(this.result_shell_version)
    // console.log('--- exists // --')
    //

    // return this.result_shell_ls.stderr.length == 0
    return this.valid(this.result_shell_ls)
  }

  get runs_ok() {
    // console.log('--- runs_ok --')
    // // console.log('this.result_shell_ls', this.result_shell_ls)
    // // console.log('this.result_shell_version', this.result_shell_version)
    // prt(this.result_shell_ls)
    // prt(this.result_shell_version)
    // console.log('--- runs_ok // --')
    //

    // return this.result_shell_version.stderr.length == 0
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

    // return (result_shell_obj.stderr != null &&
    //   result_shell_obj.stderr.length == 0)
  }

  analyse() {
    this.result_shell_ls = spawn('ls', ['-lh', this.path])
    this.result_shell_version = spawn(this.path, ['--version'])

    if (this.exists && this.runs_ok) {
      this.analyse_version()
      if (this.version == undefined) this.warnings.push(`${this.path} exists but version could not be determined`)
    }

    if (! this.exists) this.warnings.push("executable doesn't exist")
    if (! this.runs_ok) this.warnings.push("doesn't run properly")
  }

  report() {
    console.log(`${this.path} exists: ${this.exists}`)
    console.log(`${this.path} runs ok: ${this.runs_ok}`)
    console.log(`${this.path} version: ${this.version}`)

    if (this.warnings.length > 0) {
      console.log(`Warnings: ${this.warnings}`)
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
    // if (this.result_shell_site_info.stderr == null ||
    //     this.result_shell_site_info.stderr.length > 0)
    //   return

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
    console.log(`${this.path} sys_path: ${sys_path.length} entries`)
  }
}

class Pip extends Base {
  constructor(path) {
    super(path);
    this.site_package_path
    // this.path = path
    // this.result_shell_ls
    // this.result_shell_version
    // this.version
    // this.warnings = []

    // // DEBUG
    // console.log('--- Pip constructor --')
    // console.log('this.path', this.path)
    // console.log('this.result_shell_ls', this.result_shell_ls)
    // console.log('this.result_shell_version', this.result_shell_version)
    // console.log('--- Pip constructor // --')

    this.analyse()
  }

  // get exists() {
  //   return this.result_shell_ls.stderr.length == 0
  // }
  // get runs_ok() {
  //   return this.result_shell_version.stderr.length == 0
  // }

  analyse() {
    super.analyse()
    // this.result_shell_ls = spawn( 'ls', [ '-lh', this.path ] )
    // this.result_shell_version = spawn( this.path, [ '--version' ] )

    // DEBUG
    // console.log('--- ANALYSE --')
    // // console.log('this.result_shell_ls', this.result_shell_ls)
    // console.log('this.result_shell_version', this.result_shell_version)
    // prt(this.result_shell_ls)
    // prt(this.result_shell_version)
    // console.log('--- ANALYSE // --')

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
    // console.log(`${this.path} exists: ${this.exists}`)
    // console.log(`${this.path} runs ok: ${this.runs_ok}`)
    // console.log(`${this.path} version: ${this.version}`)
    console.log(`${this.path} site_package_path: ${this.site_package_path}`)
  }
}

let pip_usr_local_bin = new Pip('/usr/local/bin/pip')
let python_usr_bin = new Python('/usr/bin/python')

python_usr_bin.report()
pip_usr_local_bin.report()



// prt(ls_python_usr_bin)
// prt(ls_python_usr_local_bin)
// prt(pip_usr_local_bin)

let pip_in_site = sys_path.indexOf(pip_usr_local_bin.site_package_path) >= 0
console.log(`${pip_usr_local_bin.path} associated with mac system python? ${pip_in_site}`)

// this alters the global 'sys_path' - BAD - need to make sys_path a local to each python instance
sys_path = []
let python_usr_local_bin = new Python('/usr/local/bin/python')
python_usr_local_bin.report()
if (sys_path.length > 0) {
  pip_in_site = sys_path.indexOf(pip_usr_local_bin.site_package_path) >= 0
  console.log(`${pip_usr_local_bin.path} associated with OTHER python (if any)? ${pip_in_site}`)
}

console.log('DONE ')
