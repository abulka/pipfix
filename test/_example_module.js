let fs = require('fs')
let flag = false

function get_flag() {
  return flag
}

function reset_flag() {
  flag = false
}

function example() {
  fs.stat('./LICENSE', (err, stats) => {
    flag = true
  })
}

exports.example = example
exports.reset_flag = reset_flag
exports.get_flag = get_flag
