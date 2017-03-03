'use strict';

const format = require('pretty-format')  // https://github.com/facebook/jest/tree/master/packages/pretty-format
// const format = require('pretty-format')  // https://github.com/facebook/jest/tree/master/packages/pretty-format

let {Python, Pip, Brain} = require('./lib.js')

// TODO should use proper command line parsing and have options etc.

let brain = new Brain()

for (let el of [...brain.pythons, ...brain.pips])
  console.log(`${el.path} ---------- ${format(el.report_obj)}`)

// for (let pip of brain.pips)
//   console.log('----------', format(pip.report_obj))


// let python_usr_bin = brain.get_python('/usr/bin/python')
// let python_usr_local_bin = brain.get_python('/usr/local/bin/python')
// let python_default = brain.python_default
// let pip_usr_local_bin = brain.get_pip('/usr/local/bin/pip')
// let pip_default = brain.pip_default
// let pythons = brain.pythons
// let pips = brain.pips
//
//
// let report = {
//   '1st Python': python_usr_bin.report_obj,
//   '2nd Python': python_usr_local_bin.report_obj,
//   'Pip': pip_usr_local_bin.report_obj
// }
// // console.log(format(report))

// console.log('1st Python')
// console.log('----------', format(python_usr_bin.report_obj))
// // console.log(format(python_usr_bin.report_obj))
//
// if (python_usr_local_bin != undefined) {
//   console.log('')
//   console.log('2nd Python')
//   console.log('----------', format(python_usr_local_bin.report_obj))
//   // console.log(format(python_usr_local_bin.report_obj))
// }
//
// console.log('')
//
// if (python_default != undefined) {
//   console.log('Default Python')
//   console.log('----------', format(python_default.report_obj))
//   console.log('')
// }
//
// console.log('Pip')
// console.log('---', format(pip_usr_local_bin.report_obj))
// // console.log(format(pip_usr_local_bin.report_obj))
// console.log('')
//
// if (pip_default != undefined) {
//   console.log('Default Pip')
//   console.log('----------', format(pip_default.report_obj))
//   console.log('')
// }

function advice() {
  console.log('')
  console.log('Recommendations', `(${brain.pythons.length} pythons found, ${brain.pips.length} pips found)`)
  console.log('---------------')
  const tab = '   - '
  for (let python of brain.pythons) {
    console.log(`${python.path}`)
    // if (! python.exists) {
    //   console.log(`${tab}not installed, install via brew or python.org installer`)
    //   console.log('')
    //   continue
    // }
    if (python.pip_module_version == undefined) {
      console.log(`${tab}has no pip`)
      // Possible values are: 'darwin', 'freebsd', 'linux', 'sunos' or 'win32'
      if (process.platform == 'darwin') {
        if (python.path == '/usr/bin/python') {
          console.log(`${tab}try "sudo easy_install pip" which puts pip into "/usr/local/bin"`)
          if (brain.get_pip('/usr/local/bin/pip').exists)
            console.log(`${tab}warning: another pip already exists there, so perhaps rename the old one to "${brain.get_pip('/usr/local/bin/pip').path}_sys"`)
        }
      }
    }
    else
      console.log(`${tab}ok`)

  console.log('')
  }

  for (let pip of brain.pips) {
    console.log(`${pip.path}`)
    if (pip.runs_ok && pip.size == 0) {
      console.log(`${tab}pip exists but somehow is 0 bytes !?, try to uninstall and reinstall ${brain.get_pip('/usr/local/bin/pip').path}.`)
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

