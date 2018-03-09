var fs = require('fs');
var opn = require('opn');
const format = require('pretty-format')  // https://github.com/facebook/jest/tree/master/packages/pretty-format
const path = require('path')

const OUT_FILENAME = "out.html"
const site_dot = '[shape=box,color=grey,fontcolor=dimgrey]'

function visualise_digraph(brain) {
  let sites = new Set()
  let result = ''
  for (let python of brain.pythons) {
    result += `  "${r(python.path)}" [shape=box,color=green,fillcolor=lightgreen,fontsize=18]\n`
    result += `  "${r(python.path)}" -> "${r(python.pip_module_site_package_path)}" [style=dotted]\n`
    sites.add(r(python.pip_module_site_package_path))
  }
  for (let pip of brain.pips) {
    result += `  "${r(pip.path)}" [shape=box]\n`
    result += `  "${r(pip.path)}" -> "${r(pip.site_package_path)}" [style=dotted]\n`
    sites.add(r(pip.site_package_path))

    let relationship
    Object.keys(pip.site_relationships).forEach( key => {
      if (pip.site_relationships[key])
        result += `  "${r(pip.path)}" -> "${r(key)}" [color=blue]\n`  // pip to python relationship
    });

  }
  for (let site of sites)
    result += `  "${r(site)}" ${site_dot};\n`
  return `digraph G {\n${result}\n}`
}
function visualise_digraphs(brain) {
  // returns multiple digraphs in a list of dicts
  let results = []
  for (let python of brain.pythons) {
    let sites = new Set()
    let result = ''
    result += `  "${r(python.path)}" [shape=component,style="bold",color=green,fillcolor=lightgreen,fontsize=18]\n`
    result += `  "${r(python.path)}" -> "${r(python.pip_module_site_package_path)}" [style=dotted]\n`
    sites.add(r(python.pip_module_site_package_path))

    for (let pip of brain.pips) {  
      let relationship
      Object.keys(pip.site_relationships).forEach( key => {
        if (key == python.path && pip.site_relationships[key]) {
          result += `  "${r(pip.path)}" [shape=box]\n`
          result += `  "${r(pip.path)}" -> "${r(pip.site_package_path)}" [style=dotted]\n`
          sites.add(r(pip.site_package_path))
    
          result += `  "${r(pip.path)}" -> "${r(key)}" [color=blue]\n`  // pip to python relationship
        }
      });
    }
    for (let site of sites)
      result += `  "${r(site)}" ${site_dot};\n`

    let final_obj = {}
    final_obj.digraph = `digraph G {\n${result}\n}`
    final_obj.python = python
    results.push( final_obj )
  }
  return results
}

function r(s) {
  // return s.replace(/\//g, ' / ')
  // return s.replace(/\/usr/g, '/usr\n')
  return s
}

function viz1(digraph_text) {
  let template = `
    <html>
    <body>
    
    <h1>Pipfix Visualisation</h1>

    <p>Blue lines are pip's pointing to pythons.  
    Square boxes are site packages directories. 
    Dotted lines are pointers to site package locations.</p>

    <img src='https://g.gravizo.com/svg?
      ${digraph_text}
    '/>

    </body>
    </html>
    `
    return template
}

function viz2(digraph_text) {
  let template = `
  <html>

  <head>
    <title>Pipfix Visualisation</title>
  
    <script type="text/javascript" src="vis.min.js"></script>
    <link href="vis.min.css" rel="stylesheet" type="text/css" />
  
    <style type="text/css">
      #mynetwork {
        width: 80%;
        height: 1400px;
        border: 1px solid lightgray;
      }
    </style>
  </head>
  
  <body>
    
    <h1>Pipfix Visualisation</h1>

    <p>Blue lines are pip's pointing to pythons.  
    Square boxes are site packages directories. 
    Dotted lines are pointers to site package locations.</p>

    <div id="mynetwork"></div>

    <script type="text/javascript">
    var DOTstring = \`
    ${digraph_text}
    \`

    var parsedData = vis.network.convertDot(DOTstring);
    var data = {
      nodes: parsedData.nodes,
      edges: parsedData.edges
    }
    console.log(data)
    // create a network
    var container = document.getElementById('mynetwork');
    var options = {
      interaction: {
        dragNodes: true,
        zoomView: false,
        navigationButtons: true,
      },
      nodes: {
        widthConstraint: { maximum: 170 },
        borderWidth: 3,
        color: {
          //background: 'white',
          //highlight: 'yellow',
          //border: 'black',
        },
      },
      layout: {
        // hierarchical: {
        //     direction: 'UD'
        // }
        // randomSeed: 2,
        // improvedLayout: false,
      },
      physics: {
        barnesHut: {
          avoidOverlap: 0.5,
          centralGravity: 0.3,
        }
      },
    
  };
    var network = new vis.Network(container, data, options);

    network.on('click', function (info) {
      console.log(info)
    });

    </script>
    </body>
    </html>
    `
    return template
}


function viz3(digraph_text) {
  let template = `
  <!doctype html>
  <html>
  <head>
    <title>Viz</title>
    <script type="text/javascript" src="viz.js"></script>
  </head>
  <body>
    <p>
      Hi
    </p>
  <script>
      document.body.innerHTML += "<p>Sample addition.</p>";
      document.body.innerHTML += Viz(\`${digraph_text}\`, "svg");
    </script>
  </body>
  </html>
    `
    return template
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

  for (digraph_obj of digraph_objs) {
    template += `
        document.body.innerHTML += '<h2>${digraph_obj.python.version}</h2>'
        document.body.innerHTML += Viz(\`${digraph_obj.digraph}\`, "svg")
        `

        if (digraph_obj.python.report_obj != {})
          template += `
            document.body.innerHTML += '<h3>analysis</h3>'
            document.body.innerHTML += \`<pre>${format(digraph_obj.python.report_obj)}</pre>\`
            `

        if (digraph_obj.python.report_obj != {})
          template += `
            document.body.innerHTML += '<h3>sys path</h3>'
            document.body.innerHTML += \`<pre>${format(digraph_obj.python.sys_path)}</pre>\`
            `

        if (digraph_obj.python.report_obj.is_default)
          template += `
            document.body.innerHTML += '<h3>advice</h3>'
            document.body.innerHTML += '<p>This is the <b>default</b> ${path.basename(digraph_obj.python.report_obj.path)}</p>'
            `
  }
  template += `
    </script>
  </body>
  </html>
    `
  return template
}


function write_to_file(html_text) {
  fs.writeFile(OUT_FILENAME, html_text, function(err) {
      if(err) {
          return console.log(err);
      }
  
      console.log(`The file '${OUT_FILENAME}' was saved!`);

      // opens the url in the default browser 
      opn(OUT_FILENAME);
      console.log('done opening file')
      process.exit()

      // specify the app to open in 
      // opn('http://sindresorhus.com', {app: 'firefox'});
  });
}

function visualise_all_in_one(brain, logger) {
  let digraph_text = visualise_digraph(brain)
  logger.debug(digraph_text)  // verbose
  let html = viz3(digraph_text)
  write_to_file(html)
  
}

function visualise(brain, logger) {
  let digraph_objs = visualise_digraphs(brain)
  for (let digraph_obj of digraph_objs) {
    logger.debug(digraph_objs.digraph)  // verbose
  }
  let html = viz3_multiple(brain, digraph_objs)
  write_to_file(html)
}

exports.visualise = visualise

