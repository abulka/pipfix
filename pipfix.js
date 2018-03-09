'use strict';

const format = require('pretty-format')  // https://github.com/facebook/jest/tree/master/packages/pretty-format
const prog = require('caporal');  // https://github.com/mattallty/Caporal.js
let {Brain} = require('./lib.js')
let {advice} = require('./advice.js')
let {visualise} = require('./visualise.js')

prog
  .version('1.0.0')
  .description('Reports python installed and any related pips')
  .option('--advice', 'Generate advice', prog.BOOL)
  .option('--report', 'Generate JSON report', prog.BOOL)
  .option('--visualise', 'Visualise as graph in browser', prog.BOOL)
  .option('--anacondas', 'Scan for multiple virtual Anaconda pythons (may be slow if you have a lot)', prog.BOOL)
  .action(function(args, options, logger) {
    logger.debug("pipfix is analysing...", options, '\n')

    let brain = new Brain(logger)  // pass winston logger to brain, no such thing as options.verbose - verbose just sets logging level to debug rather than info

    if (options.anacondas)
      brain.find_anacondas()
          
    brain.analyse_relationships()  // inform all pips of all other pythons
    brain.report()  // always do this, cos visualisations also now rely on some report_obj info

    if (options.report) {
      for (let el of [...brain.pythons, ...brain.pips])
        console.log(`${el.path} ---------- ${format(el.report_obj)}`)
      console.log(`Site Relationships Detail: ---------- ${format(brain.report_obj_site_relationships)}`)
      console.log(`Overall: ---------- ${format(brain.report_obj)}`)
    }

    if (options.advice)
      advice(brain)

    if (options.visualise)
      visualise(brain, logger)

    logger.debug('DONE ')
  });

prog.parse(process.argv);
