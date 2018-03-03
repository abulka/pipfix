function advice(brain) {
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
          if (brain.get_pip('/usr/local/bin/pip') != undefined && brain.get_pip('/usr/local/bin/pip').exists)
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

exports.advice = advice

