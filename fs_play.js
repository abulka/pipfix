let fs = require('fs')

function fs_play() {
  fs.stat('./fs_play.js', (err, stats) => {
    console.log('fs_play:fs_play(): calling fs.stat on fs_play.js - result err, stats =', err, stats)
  })
}

exports.fs_play = fs_play
