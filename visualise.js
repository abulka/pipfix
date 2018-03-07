var fs = require('fs');
var opn = require('opn');

const OUT_FILENAME = "out.html"

function visualise_digraph(brain) {
  // let sites = []
  let sites = new Set()
  let result = ''
  let s
  for (let python of brain.pythons) {
    result += `  "${python.path}" -> "${python.pip_module_site_package_path}" [style=dotted];\n`
    sites.add(python.pip_module_site_package_path)
  }
  for (let pip of brain.pips) {
    result += `  "${pip.path}" -> "${pip.site_package_path}" [style=dotted];\n`
    sites.add(pip.site_package_path)

    let relationship
    Object.keys(pip.site_relationships).forEach( key => {
      if (pip.site_relationships[key])
        result += `  "${pip.path}" -> "${key}" [color=blue];\n`  // pip to python relationship
    });

  }
  for (let site of sites)
    result += `  "${site}" [shape=box];\n`
  return `digraph G {\n${result}\n}`
}

function viz1(digraph_text) {
  let template = `<html>
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

function visualise(brain) {
  let digraph_text = visualise_digraph(brain)
  // console.log(digraph_text)
  let html = viz1(digraph_text)
  write_to_file(html)
  
}

exports.visualise = visualise

