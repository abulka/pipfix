'use strict';

const format = require('pretty-format')  // https://github.com/facebook/jest/tree/master/packages/pretty-format
// const format = require('pretty-format')  // https://github.com/facebook/jest/tree/master/packages/pretty-format

let {Python, Pip, Brain} = require('./lib.js')
let {advice} = require('./advice.js')

// TODO should use proper command line parsing and have options etc.

let brain = new Brain()

for (let el of [...brain.pythons, ...brain.pips])
  console.log(`${el.path} ---------- ${format(el.report_obj)}`)

advice(brain)

console.log('DONE ')

