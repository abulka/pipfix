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
  .action(function(args, options, logger) {
    logger.info("pipfix is analysing...", options)

    let brain = new Brain()

    if (! options.noreport)
      for (let el of [...brain.pythons, ...brain.pips])
        console.log(`${el.path} ---------- ${format(el.report_obj)}`)

    if (! options.noadvice)
      advice(brain)

    console.log('DONE ')
  });

prog.parse(process.argv);
