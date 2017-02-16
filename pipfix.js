'use strict';

let spawn = require( 'child_process' ).spawnSync

// let python_usr_bin = spawn( 'ls', [ '-lh', '/usr/bin/python' ] )
// let python_usr_bin_version = spawn( '/usr/bin/python', [ '--version'] )
// let python_usr_local_bin = spawn( 'ls', [ '-lh', '/usr/local/bin/python' ] )
// let pip_usr_local_bin = spawn( 'ls', [ '-lh', '/usr/local/bin/pip' ] )
// let pip_usr_local_bin_version = spawn( '/usr/local/bin/pip', [ '--version' ] )
let python_usr_bin_site = spawn( '/usr/bin/python', [ '-m', 'site' ] )
// prt(python_usr_bin_site)
//
// let ppp = spawn( 'ls', [ '-lh', '/usr/local/bin/pip' ] )
// prt(ppp)

let info

function prt(cmd) {
  if (cmd.stderr.length != 0)
    console.log(`stderr: ${cmd.stderr.toString()}`)
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
    this.result_shell_version = 'fred'
    this.version
    this.warnings = []
  }

  get exists() {
    // console.log('--- exists --')
    // // console.log('this.result_shell_ls', this.result_shell_ls)
    // // console.log('this.result_shell_version', this.result_shell_version)
    // prt(this.result_shell_ls)
    // prt(this.result_shell_version)
    // console.log('--- exists // --')
    //
    return this.result_shell_ls.stderr.length == 0
  }

  get runs_ok() {
    // console.log('--- runs_ok --')
    // // console.log('this.result_shell_ls', this.result_shell_ls)
    // // console.log('this.result_shell_version', this.result_shell_version)
    // prt(this.result_shell_ls)
    // prt(this.result_shell_version)
    // console.log('--- runs_ok // --')
    //
    return this.result_shell_version.stderr.length == 0
  }
}

class Python extends Base {
  constructor(path) {
    super(path);
    this.site_package_paths = []
    // this.analyse()
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
    this.result_shell_ls = spawn( 'ls', [ '-lh', this.path ] )
    this.result_shell_version = spawn( this.path, [ '--version' ] )

    // DEBUG
    // console.log('--- ANALYSE --')
    // // console.log('this.result_shell_ls', this.result_shell_ls)
    // console.log('this.result_shell_version', this.result_shell_version)
    // prt(this.result_shell_ls)
    // prt(this.result_shell_version)
    // console.log('--- ANALYSE // --')

    if (this.exists && this.runs_ok) {
      this.analyse_version()
      if (this.version == undefined) this.warnings.push(`${this.path} exists but version could not be determined`)
    }

    if (! this.exists) this.warnings.push("executable doesn't exist")
    if (! this.runs_ok) this.warnings.push("doesn't run properly")
  }

  analyse_version() {
    const regex = /pip (.*) from (.*)\/site-packages/

    let match = regex.exec(this.result_shell_version.stdout.toString())
    if (match != null) {
      this.version = match[1]
      this.site_package_path = match[2] + '/site-packages'
    }
  }

  report() {
    console.log(`${this.path} exists: ${this.exists} runs ok: ${this.runs_ok} version: ${this.version} site_package_path: ${this.site_package_path}`)
    if (this.warnings.length > 0) {
      console.log(`Warnings: ${this.warnings}`)
      // if verbose
      prt(this.result_shell_ls)
      prt(this.result_shell_version)
    }
  }
}

let pip_usr_local_bin = new Pip('/usr/local/bin/pip')
let python_usr_bin = new Python('/usr/bin/python')

// python_usr_bin.report()
pip_usr_local_bin.report()

// parse the site info
// prt(python_usr_bin_site)
let line = ''
let scan = false
let sys_path_str = 'var sys_path = '
let sys_path
let chunk = ''
let stdout = python_usr_bin_site.stdout.toString()
let lines = stdout.split("\n")

// alternatively, pure ECMA6, use the new 'of' syntax
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

// prt(ls_python_usr_bin)
// prt(ls_python_usr_local_bin)
// prt(pip_usr_local_bin)

let pip_in_site = sys_path.indexOf(pip_usr_local_bin.site_package_path) >= 0
// console.log('sys_path', sys_path)
console.log(`${pip_usr_local_bin.path} associated with system python? ${pip_in_site}`)

console.log('DONE ')
