var fs = require('fs');
var opn = require('opn');

const OUT_FILENAME = "out.html"

function visualise_digraph(brain) {
  let sites = new Set()
  let result = ''
  let site_dot = '[shape=box,color=grey,fillcolor=lightgrey,fontcolor=Red]'
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

function visualise(brain, logger) {
  let digraph_text = visualise_digraph(brain)
  logger.debug(digraph_text)  // verbose
  let html = viz1(digraph_text)
  write_to_file(html)
  
}

exports.visualise = visualise

