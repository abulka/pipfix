var fs = require('fs');
var opn = require('opn');

function visualise_digraph(brain) {
  // let sites = []
  let sites = ''
  let result = ''
  let s
  for (let python of brain.pythons) {
    result += `  "${python.path}" -> "${python.pip_module_site_package_path}" [style=dotted];\n`
    sites += `  "${python.pip_module_site_package_path}" [shape=box];\n`  // todo should put into a set and not repeat
  }
  for (let pip of brain.pips) {
    result += `  "${pip.path}" -> "${pip.site_package_path}" [style=dotted];\n`
    sites += `  "${pip.site_package_path}" [shape=box];\n`  // todo should put into a set and not repeat

    let relationship
    Object.keys(pip.site_relationships).forEach( key => {
      if (pip.site_relationships[key])
        result += `  "${pip.path}" -> "${key}" [color=blue];\n`  // pip to python relationship
    });

  }
  return `digraph G {\n${sites}\n${result}\n}`
}

function write_to_file(digraph_text) {
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
  fs.writeFile(OUT_FILENAME, template, function(err) {
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
  const OUT_FILENAME = "out.html"

  digraph_text = visualise_digraph(brain)
  console.log(digraph_text)
  
  write_to_file(digraph_text)
}

exports.visualise = visualise

