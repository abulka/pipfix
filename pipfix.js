'use strict';
const format = require('pretty-format')  // https://github.com/facebook/jest/tree/master/packages/pretty-format
// const format = require('pretty-format')  // https://github.com/facebook/jest/tree/master/packages/pretty-format
let {Python, Pip, Which} = require('./lib.js')

// TODO should use proper command line parsing and have options etc.

// standard pythons and pip

let python_usr_bin = new Python('/usr/bin/python')
let python_usr_local_bin = new Python('/usr/local/bin/python')
let pip_usr_local_bin = new Pip('/usr/local/bin/pip')

// look for defaults

let python_default
let path_python_default = new Which('python', [python_usr_bin.path, python_usr_local_bin.path]).path()
if (path_python_default != null)
  python_default = new Python(path_python_default)
if (python_default != undefined)
  pip_usr_local_bin.inform_about(python_default)

let pip_default
let path_pip_default = new Which('pip', [pip_usr_local_bin.path]).path()
if (path_pip_default != null)
  pip_default = new Pip(path_pip_default)

// construct list of all pythons and pips

let pythons = []
pythons.push(python_usr_bin)
pythons.push(python_usr_local_bin)
if (python_default != undefined)
  pythons.push(python_default)

let pips = []
pips.push(pip_usr_local_bin)
if (pip_default != undefined)
  pips.push(pip_default)

// inform all pips of all other pythons
for (let pip of pips)
  for (let python of pythons)
    pip.inform_about(python)

// report

python_usr_bin.report()
python_usr_local_bin.report()
if (python_default != undefined)
  python_default.report()
pip_usr_local_bin.report()
if (pip_default != undefined)
  pip_default.report()
//
// let report = {
//   '1st Python': python_usr_bin.report_obj,
//   '2nd Python': python_usr_local_bin.report_obj,
//   'Pip': pip_usr_local_bin.report_obj
// }
// // console.log(format(report))

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

if (pip_default != undefined) {
  console.log('Default Pip')
  console.log('----------', format(pip_default.report_obj))
  console.log('')
}

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

  for (let pip of pips) {
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

