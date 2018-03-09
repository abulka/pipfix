var fs = require('fs');
var opn = require('opn');
const format = require('pretty-format')  // https://github.com/facebook/jest/tree/master/packages/pretty-format
const path = require('path')

const OUT_FILENAME = "out.html"
const site_dot = '[shape=box,color=grey,fontcolor=dimgrey]'
const python_dot = '[shape=component,style="bold",color=green,fillcolor=lightgreen,fontsize=18]'
const pip_dot = '[shape=box]'

function visualise_digraphs(brain) {
  // returns multiple digraphs in a list of dicts
  let results = []
  Object.keys(brain.sites).forEach( key => {
    let result = ''

    // Add site
    let site = brain.sites[key]
    result += `  "${r(site.path)}" ${site_dot};\n`

    for (let python of site.pythons) {
      // Add python
      result += `  "${r(python.path)}" ${python_dot}\n`
      // Add python -> site
      result += `  "${r(python.path)}" -> "${r(site.path)}" [style=dotted]\n`

      if (python.pips.length == 0) {
        // Add ?? pip
        result += `  "${r('?? no pip in path')}" ${pip_dot}\n`
        result += `  "${r('?? no pip in path')}" -> "${r(python.path)}" [style=dotted,color=red]\n`
    }
      // Add python -> pip (redundant)
      // for (let pip of python.pips)
      //   result += `  "${r(pip.path)}" -> "${r(python.path)}" [color=red]\n`
    }
    
    for (let pip of site.pips) {
      // Add pip
      result += `  "${r(pip.path)}" ${pip_dot}\n`
      // Add pip -> site
      result += `  "${r(pip.path)}" -> "${r(site.path)}" [style=dotted]\n`
      // Add pip -> python
      for (let python of pip.pythons)
        result += `  "${r(pip.path)}" -> "${r(python.path)}" [color=blue]\n`
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
    logger.debug(digraph_objs.digraph)  // pipfix --verbose sets logger to debug level, thus we would see this
  }
  let html = viz3_multiple(brain, digraph_objs)
  write_to_file(html, logger)
}

exports.visualise = visualise
