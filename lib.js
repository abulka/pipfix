'use strict';

let glob = require("glob")
let spawn = require( 'child_process' ).spawnSync
const {run_async} = require('./run_async.js')
let {UserException} = require('./util.js')
const path = require('path')
let winston = require('winston')
let lodash = require('lodash/function')  // https://lodash.com/docs/4.17.5#memoize

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

function prt(cmd) {
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
    this.is_default2 = false
    this.is_default3 = false
    this.result_shell_ls
    this.result_shell_version
    this.result_shell_file_size
    this.version
    this.size
    this.warnings = []
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
    this.result_shell_site_info
    this.result_shell_run_pip_as_module
    this.sys_path = []
    this.pip_module_version
    this.pip_module_site_package_path
    this.pips = []          // proposed
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

  // get pips_default() {  // proposed
  //   // Which pips are default, default2 or default3 (i.e. invocable from the command line by typing pip, pip2 or pip3).
  //   // cos if this list is empty, then whilst there may be a theoretical pip for this python, it cannot be invoked except
  //   // via explicit path, or via "python -m pip" (which always works).
  //   let result = []
  //   for (let pip of this.pips)
  //     if (pip.is_default || pip.is_default2 || pip.is_default3)
  //       result.push(pip)
  //   return result
  // }  

  report() {
    super.report()
    if (this.runs_ok) {
      this.report_obj['sys.path'] = `${this.sys_path.length} entries`

      this.report_obj.pip = {}
      this.report_obj.pip.installed = this.pip_module_version != undefined
      this.report_obj.pip.version = this.pip_module_version
      this.report_obj.pip.site = this.pip_module_site_package_path
      this.report_obj.pip.path = this.path + ' -m pip'

      this.report_obj.pips = this.pips.map(el => el.path)
      // this.report_obj.pips_default = this.pips_default.map(el => el.path)

      this.report_obj.is_default_for = []
      if (this.is_default) this.report_obj.is_default_for.push('python')
      if (this.is_default2) this.report_obj.is_default_for.push('python2')
      if (this.is_default3) this.report_obj.is_default_for.push('python3')
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

  report() {
    super.report()
    this.report_obj.site = this.site_package_path
    this.report_obj.pythons = this.pythons.map(el => el.path)

    this.report_obj.is_default_for = []
    if (this.is_default) this.report_obj.is_default_for.push('pip')
    if (this.is_default2) this.report_obj.is_default_for.push('pip2')
    if (this.is_default3) this.report_obj.is_default_for.push('pip3')    
  }
}

class Site {
  constructor(path) {
    this.path = path
    this.pythons = new Set()
    this.pips = new Set()
  }
}

class Brain {
  /*
  Create an instance of this and all the scanning will be done.
  To optionally look for anacondas call .find_anacondas()
  When ready to see the results call .analyse_relationships() 
  Then call .report() to generate a .report_obj which can be pretty printed. 
    Each python and pip in .pythons and .pips will also have a .report_obj which can be pretty printed. 
    Also .report_obj_site_relationships is available separately, because it is so verbose
  */

  constructor(logger) {
    this.logger = (logger == undefined) ? winston : logger  // logger may come from CLI invocation, otherwise use default winston logger
    this.pythons = []
    this.pips = []
    this.python_default
    this.python2_default
    this.python3_default
    this.pip_default
    this.pip2_default
    this.pip3_default
    this.visualisation = ''
    this.verbose = true
    this.report_obj = {}
    this.sites = {}

    this.symbolic_path = lodash.memoize(this.symbolic_path)  // cache

    this.find_python('/usr/bin/python')
    this.find_python('/usr/local/bin/python')
    this.find_python('/usr/local/bin/python2')
    this.find_python('/usr/local/bin/python3')
    for (let file_path of glob.sync("/usr/local/Cellar/python*/*/bin/python*(2|3)"))
      this.find_python(file_path)
    this.python3_default = this.find_default('python3', this.pythons, Python)
    this.python2_default = this.find_default('python2', this.pythons, Python)
    this.python_default = this.find_default('python', this.pythons, Python)

    this.find_pip('/usr/bin/pip')
    this.find_pip('/usr/local/bin/pip')
    this.find_pip('/usr/local/bin/pip2')
    this.find_pip('/usr/local/bin/pip3')
    for (let file_path of glob.sync("/usr/local/Cellar/python*/*/bin/pip*(2|3)"))
      this.find_pip(file_path)
    this.pip3_default = this.find_default('pip3', this.pips, Pip)
    this.pip2_default = this.find_default('pip2', this.pips, Pip)
    this.pip_default = this.find_default('pip', this.pips, Pip)
  }

  report() {
    const NO_PIP_ASSOCATED = '?? no associated pip, pip2 or pip3 found in path'
    const NO_PIP = 'not found in path'

    this.report_obj = {}
    this.report_obj.pythons = this.pythons.map(el => el.path)
    this.report_obj.pips = this.pips.map(el => el.path)
    
    this.report_obj.sites = Object.entries(this.sites).map( el => el[1].path ) // get list of k,v tuples, then then iterate using map 

    function python_info(python) {
      let res = python.pips.map(el => el.path)
      return `${python.path} <-- ${res.length ? res : NO_PIP_ASSOCATED}`  // might be more than one pip...
    }
    function pip_info(pip) {
      let res = pip.pythons.map(el => el.path)
      return `${pip.path} --> ${res.length ? res : '??'}`  // should only be one python, but just in case...
    }
    this.report_obj.defaults = {}
    this.report_obj.defaults.python = this.python_default ? python_info(this.python_default) : ''
    this.report_obj.defaults.python2 = this.python2_default ? python_info(this.python2_default) : ''
    this.report_obj.defaults.python3 = this.python3_default ? python_info(this.python3_default) : ''
    this.report_obj.defaults.pip = this.pip_default ? pip_info(this.pip_default) : NO_PIP
    this.report_obj.defaults.pip2 = this.pip2_default ? pip_info(this.pip2_default) : NO_PIP
    this.report_obj.defaults.pip3 = this.pip3_default ? pip_info(this.pip3_default) : NO_PIP

    // Detail

    this.report_obj_site_relationships = {}
    Object.keys(this.sites).forEach( key => {
      this.report_obj_site_relationships[key] = {}
      let site = this.sites[key]
      this.report_obj_site_relationships[key].pythons = [...site.pythons].map(el => el.path)
      this.report_obj_site_relationships[key].pips = [...site.pips].map(el => el.path)
    } )
    
    // Python and Pips

    for (let python of this.pythons)
      python.report()
    for (let pip of this.pips)
      pip.report()
  }

  get_site(path) {
    // returns a Site object
    if (this.sites[path] == undefined)
      this.sites[path] = new Site(path)
    return this.sites[path]
  }

  find_anacondas() {
    let virt_env_dirs = new Set()
    for (let python of this.pythons) {
      if (python.runs_ok && python.version.includes('Anaconda, Inc.')) {
        let envs_dir = this.find_envs_dir(python.path)
        if (envs_dir != undefined)
          virt_env_dirs.add(envs_dir)
      }
    }
    if (virt_env_dirs.size > 0)
      console.log(`${virt_env_dirs.size} Anaconda dirs containing virtual environments found:`, virt_env_dirs, 'scanning...')

    for (let env_path of virt_env_dirs) {
      let pythons = glob.sync(path.join(env_path, '*/bin/python*(2|3)'))  // * matches zero or more, ? matches exactly one
      let pips = glob.sync(path.join(env_path, '*/bin/pip*(2|3)'))
      // console.log('FOUND', pythons, pips)

      for (let file_path of pythons)
        this.find_python(file_path)
      for (let file_path of pips)
        this.find_pip(file_path)
      
    }
  }

  find_envs_dir(path_) {
    // scan upwards till find the root of all the virtual envs
    // '/Users/Andy/miniconda/envs/py36/bin/python'
    let path_obj = path.parse(path_)
    let dir = path_obj.dir // '/Users/Andy/miniconda/envs/py36/bin'
    let basename = path.parse(dir)
    if (basename.base == 'bin') {
      let parent = path.parse(basename.dir)
      return parent.dir
    }
    else
      return undefined
  }

  find_python(path) {
    for (let python of this.pythons)
      if (this.paths_same(path, python.path))  // prevent duplicates
        return
    let python = new Python(path)
    if (python.exists) {
      this.pythons.push(python)
      this.logger.debug(python.path)
    }
  }

  find_pip(path) {
    for (let pip of this.pips)
      if (this.paths_same(path, pip.path))  // prevent duplicates
        return
    let pip = new Pip(path)
    if (pip.exists) {
      this.pips.push(pip)
      this.logger.debug(pip.path)
    }
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
    this.logger.debug(another.path)
    // another.is_default = true
    return another
  }

  paths_same(path1, path2) {
    // See if the paths are the same.
    // Also check against the 'stat' version of path2, just in case its a symbolic link

    if (path1 == path2)
      return true

    // console.log('COMPARING path1 == path2 symbolically which may only be a partial match??', path1, path2)
    let path2_symbolic = this.symbolic_path(path2)
    // if (path2_symbolic != undefined && (path2_symbolic.indexOf(path1) != -1))
    // console.log('SYMBOLIC COMPARE path1 == path2 symbolically which may only be a partial match??', path1, path2_symbolic)
    if (path2_symbolic != undefined && (path2_symbolic == path1))
      return true

    return false
  }

  symbolic_path(path) {
    /*
    Strips symbolic reference symbols and other rubbish from path, just in case the path returned by 'ls' is a symbolic link or an executable.
    Note we don't follow the symbolic path to its destination.
    */

    // Get more info about the path
    let result_shell_stat = spawn_xtra('stat', ['-F', path])
    if (result_shell_stat.stderr.length != 0)
      throw new UserException(`"stat" failed with error "${result_shell_stat.stderr.toString()}" thus cannot determine symbolic link behind "${path}"`)
    let symbolic_path = result_shell_stat.stdout.toString()

    // parse this properly and get the pure absolute path

    // Case 1, the lhs of the ->
    //  lrwxr-xr-x 1 Andy staff 9 Jan 11 14:21:49 2018 /Users/Andy/miniconda/envs/py36/bin/python3@ -> python3.6
    let regex = /.*?(\/.*)\s->\s(.*)/
    let match = regex.exec(symbolic_path)
    if (match != null) {
      let left = match[1]
      left = left.replace('@', '')  // strip thesymbolic link indicator symbol '@'
      return left
    }

    // Case 2, probably should not do this, since the result is the same as the incoming 'path' anyway
    //  -rwxr-xr-x 1 root wheel 66880 Jan 19 18:37:24 2018 /usr/bin/python*
    regex = /.*?(\/.*)/
    match = regex.exec(symbolic_path)
    if (match != null) {
      let left = match[1]
      left = left.replace('*', '')  // strip the executable symbol
      if (left != path)
        throw new UserException(`Error '${left}' and '${path}' should be the same`)
      return left
    }

    throw new UserException(`Could not parse '${path}' stat info '${symbolic_path}'`)
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

  inform_about(pip, python) {
    // Figure out if pip and this python share a site
    let are_associated = python.sys_path.length > 0 && python.sys_path.indexOf(pip.site_package_path) >= 0
    if (are_associated) {
      python.pips.push(pip)
      pip.pythons.push(python)
    }

    // update brain's master site knowledge
    let site = this.get_site(python.pip_module_site_package_path)
    site.pythons.add(python)
    site = this.get_site(pip.site_package_path)
    site.pips.add(pip)
  }

  analyse_relationships() {
    // inform all pips of all other pythons
    for (let pip of this.pips)
      for (let python of this.pythons)
        this.inform_about(pip, python)

    // tell each pip and python its standing as a default, default2 or default3
    for (let python of this.pythons) {
      python.is_default = this.python_default ? this.paths_same(python.path, this.python_default.path) : false
      python.is_default2 = this.python2_default ? this.paths_same(python.path, this.python2_default.path) : false
      python.is_default3 = this.python3_default ? this.paths_same(python.path, this.python3_default.path) : false
    }
    for (let pip of this.pips) {
      pip.is_default = this.pip_default ? this.paths_same(pip.path, this.pip_default.path) : false
      pip.is_default2 = this.pip2_default ? this.paths_same(pip.path, this.pip2_default.path) : false
      pip.is_default3 = this.pip3_default ? this.paths_same(pip.path, this.pip3_default.path) : false
    }
      
  }
}

exports.Python = Python
exports.Pip = Pip
exports.Brain = Brain
