var fs = require('fs');
var opn = require('opn');
const format = require('pretty-format')  // https://github.com/facebook/jest/tree/master/packages/pretty-format
const path = require('path')

const OUT_FILENAME = "out.html"
const site_dot = '[shape=box,color=grey,fontcolor=dimgrey]'
const python_dot = '[shape=component,style="bold",color=green,fillcolor=lightgreen,fontsize=18]'
const pip_dot = '[shape=box,color=blue]'
const pip_dot_warn = '[shape=invhouse,color=blue,fillcolor=red,style=filled]'
const default_python_dot = '[style=dashed,color=green]'
const default_pip_dot = '[style=dashed,color=blue]'
const aka_python_dot = '[shape=component,color=green,fontsize=10,width=0.5]'

function sort_by_length(arr) {
  arr.sort(function(a, b){
    // ASC  -> a.length - b.length
    // DESC -> b.length - a.length
    return b.length - a.length;
  }).reverse()
  return arr
}

function visualise_digraphs(brain) {
  // returns multiple digraphs in a list of dicts
  let results = []
  Object.keys(brain.sites).forEach( key => {
    let result = ''

    // Add site
    let site = brain.sites[key]
    result += `  "${r(site.path)}" ${site_dot};\n`

    // Pythons
    for (let python of site.pythons) {
      // Add python
      result += `  "${r(python.path)}" ${python_dot}\n`
      // Add python -> site
      result += `  "${r(python.path)}" -> "${r(site.path)}" [style=dotted]\n`

      if (python.pips.length == 0) {
        // Add ?? pip
        result += `  "${'?? no pip in path'}" ${pip_dot}\n`
        result += `  "${'?? no pip in path'}" -> "${r(python.path)}" [style=dotted,color=red]\n`
      }
      if (python.pip_module_version == undefined) {
        // Add !! pip if not installed for this python
        result += `  "${'!! pip not installed'}" ${pip_dot_warn}\n`
        result += `  "${'!! pip not installed'}" -> "${r(python.path)}" [style=dotted,color=red]\n`
      }

      // Digram the default python invocations
      if (python.report_obj) {
        if (python.report_obj.is_default_for.length == 0) {
          // Add ?? no default
          result += `  "${'?? no python in path will invoke'}" ${default_python_dot}\n`
          result += `  "${'?? no python in path will invoke'}" -> "${r(python.path)}" [style=dashed,color=green]\n`
        }
        else        
          for (let default_python_name of python.report_obj.is_default_for) {
            result += `  "${default_python_name}" ${default_python_dot}\n`
            result += `  "${default_python_name}" -> "${r(python.path)}" [style=solid,color=green]\n`
          }

        // Diagram the extra pythons which are really the same python
        if (python.report_obj.paths_all.length > 1) {
          let aka_paths_arr = []
          for (let aka_python_path of python.report_obj.paths_all) {
            if (aka_python_path == python.path) {
              msg_paths = aka_python_path
              continue
            }
            // Add another aka python into the same box
            aka_paths_arr.push(aka_python_path)
          }
          let aka_paths = sort_by_length(aka_paths_arr).join('\n')
          // Add aka pythons
          result += `  "${aka_paths}" ${aka_python_dot}\n`
          // Add aka pythons -> python
          result += `  "${python.path}" -> "${aka_paths}" [style=solid,color=green,dir=none]\n`
          // Add aka python -> site
          result += `  "${aka_paths}" -> "${r(site.path)}" [style=dotted]\n`
        }
      }

    }
    
    // Pips
    for (let pip of site.pips) {
      // Add pip
      result += `  "${r(pip.path)}" ${pip_dot}\n`
      // Add pip -> site
      result += `  "${r(pip.path)}" -> "${r(site.path)}" [style=dotted]\n`
      // Add pip -> python (could have looped through python.pips instead)
      for (let python of pip.pythons)
        result += `  "${r(pip.path)}" -> "${r(python.path)}" [color=blue]\n`


      // Digram the default pip invocations
      if (pip.report_obj) {
        if (pip.report_obj.is_default_for.length == 0) {
          // Add ?? no default
          result += `  "${'?? no pip in path will invoke'}" ${default_pip_dot}\n`
          result += `  "${'?? no pip in path will invoke'}" -> "${r(pip.path)}" [style=dashed,color=blue]\n`
        }
        else        
          for (let default_pip_name of pip.report_obj.is_default_for) {
            result += `  "${default_pip_name}" ${default_pip_dot}\n`
            result += `  "${default_pip_name}" -> "${r(pip.path)}" [style=solid,color=blue]\n`
          }
      }

    }

    // Push result
    let final_obj = {}
    final_obj.digraph = `digraph G {\n${result}\n}`
    final_obj.pythons = [...site.pythons]
    final_obj.pips = [...site.pips]
    results.push( final_obj )    
  })
  return results
}

function r(s) {
  // return s.replace(/\//g, ' / ')
  // return s.replace(/\/usr/g, '/usr\n')
  return s
}

function viz3_multiple(brain, digraph_objs) {
  let template = `
  <!doctype html>
  <html>
  <head>
    <title>Pipfix Visualisation</title>
    <script type="text/javascript" src="viz.js"></script>
    <link href="out.css" rel="stylesheet" type="text/css" />
  </head>
  <body>
    <h1>
      Pipfix Report
    </h1>
  <script>
      document.body.innerHTML += "<p>Here are the Pythons and Pips detected on your system.</p>";
    `

  template += `
      document.body.innerHTML += '<h2>Overall</h2>'
      document.body.innerHTML += \`<pre>${format(brain.report_obj)}</pre>\`
      `
  template += `
      document.body.innerHTML += '<h3>Site Relationships Detail</h3>'
      document.body.innerHTML += \`<pre>${format(brain.report_obj_site_relationships)}</pre>\`
      `

  for (let digraph_obj of digraph_objs) {
    template += `
        document.body.innerHTML += '<h2>${digraph_obj.pythons[0].version}</h2>'
        document.body.innerHTML += Viz(\`${digraph_obj.digraph}\`, "svg")
        `

    for (let python of digraph_obj.pythons) {

      if (python.report_obj != {})
        template += `
            document.body.innerHTML += '<h3>Python Analysis</h3>'
            document.body.innerHTML += \`<pre>${format(python.report_obj)}</pre>\`
            `

      if (python.report_obj != {})
        template += `
            document.body.innerHTML += '<h4>sys path</h4>'
            document.body.innerHTML += \`<pre>${format(python.sys_path)}</pre>\`
            `

      if (python.report_obj.is_default)
        template += `
            document.body.innerHTML += '<h4>python advice</h4>'
            document.body.innerHTML += '<p>This is the <b>default</b> ${path.basename(python.report_obj.path)}</p>'
            `
    }

    for (let pip of digraph_obj.pips) {

      if (pip.report_obj != {})
        template += `
            document.body.innerHTML += \`<h3>${pip.path}</h3>\`
            document.body.innerHTML += \`<pre>${format(pip.report_obj)}</pre>\`
            `
    }

  }

  template += `
    </script>
  </body>
  </html>
    `
  return template
}

function write_to_file(html_text, logger) {
  fs.writeFile(OUT_FILENAME, html_text, function(err) {
      if(err) {
          return console.log(err);
      }
      logger.info(`The file '${OUT_FILENAME}' was saved!`);

      // opens the url in the default browser 
      opn(OUT_FILENAME);
      logger.debug('done opening file')
      process.exit()
  });
}

function visualise(brain, logger) {
  let digraph_objs = visualise_digraphs(brain)
  for (let digraph_obj of digraph_objs) {
    logger.debug(digraph_obj.digraph)  // pipfix --verbose sets logger to debug level, thus we would see this
  }
  let html = viz3_multiple(brain, digraph_objs)
  write_to_file(html, logger)
}

exports.visualise = visualise
