let fs = require('fs')

function fs_play() {
  fs.stat('./LICENSE', (err, stats) => {
    // console.log('fs_play:fs_play(): calling fs.stat on LICENSE - result err, stats =', err, stats)
  })
}

exports.fs_play = fs_play
