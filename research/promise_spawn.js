'use strict'

let spawn = require('child_process').spawn

function ls(dir) {
  return new Promise(function (resolve) {
    console.log(`ls ${dir} work begins`);

    // synchronous version
    // result_shell_ls = spawn('ls', ['-lh', dir])

    // asynchronous version returns an object where .stdout is not a value but something you attach an event to
    const ls = spawn('ls', ['-lh', dir]);
    let stdout

    ls.stdout.on('data', (data) => {
      stdout = data.toString()  // remember
      // console.log(`stdout: ${data}`);
    });

    ls.stderr.on('data', (data) => {
      // console.log(`stderr: ${data}`);
    });

    ls.on('close', (code) => {
      // console.log(`child process exited with code ${code}`)
      resolve(stdout)
    });

  })
}

Promise.all([
  ls('/usr'),
  ls('/'),
  ls('/Users'),
]).then(function (arrayOfResults) {

  // console.log('final results', arrayOfResults);

  for (let result of arrayOfResults)
    console.log('result', result);
});

