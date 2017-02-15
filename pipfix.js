'use strict';

let spawn = require( 'child_process' ).spawnSync

let python_usr_bin = spawn( 'ls', [ '-lh', '/usr/bin/python' ] )
let python_usr_bin_version = spawn( '/usr/bin/python', [ '--version'] )
let python_usr_local_bin = spawn( 'ls', [ '-lh', '/usr/local/bin/python' ] )
let pip_usr_local_bin = spawn( 'ls', [ '-lh', '/usr/local/bin/pip' ] )
let pip_usr_local_bin_version = spawn( '/usr/local/bin/pip', [ '--version' ] )
let python_usr_bin_site = spawn( '/usr/bin/python', [ '-m', 'site' ] )

let info

function prt(cmd) {
  if (cmd.stderr.length != 0)
    console.log(`stderr: ${cmd.stderr.toString()}`)
  console.log(`${cmd.stdout.toString()}`)
}

console.log('--------')

// console.log( `stderr: ${ls.stderr.toString()}` );
// console.log( `stdout: ${ls.stdout.toString()}` );

info = 'System Mac python'
if (python_usr_bin.stderr.length == 0) {
  console.log(`${info} exists OK: ${python_usr_bin.stdout.toString()}`)
  console.log(`${info} version: ${python_usr_bin_version.stderr.toString()}`)  // bug in python 2.7 puts this info in stderr instead of stdout
}
else
  console.log(`${info} missing?: ${python_usr_bin.stderr.toString()}`)

info = 'Python Org or Brew python'
if (python_usr_local_bin.stderr.length == 0)
  console.log(`${info} exists OK: ${python_usr_local_bin.stdout.toString()}`)
else
  console.log(`${info} not installed in /usr/local/bin\n`)

info = 'pip'
let pip_ver
let pip_site
let pip_version_str
const rexp1 = /^pip (.*) from (.*)\/pip-.*egg/
if (pip_usr_local_bin.stderr.length == 0) {
  console.log(`${info} installed OK: ${pip_usr_local_bin.stdout.toString()}`)
  pip_version_str = pip_usr_local_bin_version.stdout.toString()
  let match = rexp1.exec(pip_version_str)
  if (match != null) {
    pip_ver = match[1]
    pip_site = match[2]
  }
  console.log(`${info} version: ${pip_version_str} which decodes to ver ${pip_ver} site pckg ${pip_site}`)
}
else
  console.log(`${info} not installed in /usr/local/bin`)

// parse the site info
// prt(python_usr_bin_site)
let line = ''
let scan = false
let sys_path_str = 'var sys_path = '
let sys_path
let chunk = ''
let stdout = python_usr_bin_site.stdout.toString()
let lines = stdout.split("\n")
lines.forEach((line, index, arr) => {
  if (line == 'sys.path = [') {
    scan = true
    return  // continue
  }
  if (scan)
    chunk = chunk + line

  if (line == ']')
    scan = false

  if (index === arr.length - 1 && line === "") {
    chunk = 'sys_path = [' + chunk
    eval(chunk)
    return  // continue
  }
});

// alternatively, pure ECMA6, use the new 'of' syntax
for (let line of lines) {
}
// or
for (let [index, value] of lines.entries()) {
}

// prt(ls_python_usr_bin)
// prt(ls_python_usr_local_bin)
// prt(pip_usr_local_bin)

let pip_in_site = sys_path.indexOf(pip_site) >= 0
// console.log('sys_path', sys_path)
console.log('pip_in_site is', pip_in_site)

console.log('DONE ')
