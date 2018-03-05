'use strict';

// const format = require('pretty-format')  // https://github.com/facebook/jest/tree/master/packages/pretty-format
const format = require('pretty-format')  // https://github.com/facebook/jest/tree/master/packages/pretty-format
const prog = require('caporal');  // https://github.com/mattallty/Caporal.js
let {Brain} = require('./lib.js')
let {advice} = require('./advice.js')

prog
  .version('1.0.0')
  .description('Reports python installed and any related pips')
  .option('--noadvice', 'Give some advice', prog.BOOL)
  .option('--noreport', 'No neport', prog.BOOL)
  .option('--visualise', 'Visualise as graph', prog.BOOL)
  .action(function(args, options, logger) {
    logger.info("pipfix is analysing...", options)

    let brain = new Brain()

    if (! options.noreport)
      for (let el of [...brain.pythons, ...brain.pips])
        console.log(`${el.path} ---------- ${format(el.report_obj)}`)

    if (! options.noadvice)
      advice(brain)

    if (options.visualise) {
      console.log(brain.visualisation)  // TODO actually we are creating the visualisation, just not displaying it

      let template = `<html>
        <body>
        
        <h1>Pipfix Visualisation</h1>

        <p>Blue lines are pip's pointing to pythons.  
        Square boxes are site packages directories. 
        Dotted lines are pointers to site package locations.</p>

        <img src='https://g.gravizo.com/svg?
          ${brain.visualisation}
        '/>

        </body>
        </html>
        `
      var fs = require('fs');
      var opn = require('opn');
      let outfilename = "out.html"
      fs.writeFile(outfilename, template, function(err) {
          if(err) {
              return console.log(err);
          }
      
          console.log(`The file '${outfilename}' was saved!`);

          // opens the url in the default browser 
          opn(outfilename);
          console.log('done opening file')
          process.exit()

          // specify the app to open in 
          // opn('http://sindresorhus.com', {app: 'firefox'});
      });
  }


    console.log('DONE ')
  });

prog.parse(process.argv);
