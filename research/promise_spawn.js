'use strict'

const spawn = require('child_process').spawn
const exec = require('child_process').exec
const execSync = require('child_process').execSync

// EXPERIMENTS

const EXPERIMENTS_A = false
const EXPERIMENTS_B = false
const EXPERIMENTS_C = true  // async 10-14 seconds
const EXPERIMENTS_D = false   // sync  23-30 seconds - double the time!

if (EXPERIMENTS_A) {
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

        // Hmmm - cannot get to stdout via the object - you have to get the info via the handler parameter
        // console.log(`getting at stdout via the ls object: ${ls.stdout.toString()}`);
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

}

if (EXPERIMENTS_B) {

  exec('cat *.js ../LICENSE | wc -l', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });

}

if (EXPERIMENTS_C) {

  const options = {
    encoding: 'utf8',
    timeout: 0,
    maxBuffer: 20000*1024,  // increased this
    killSignal: 'SIGTERM',
    cwd: null,
    env: null
  }

  function cmd(dir) {
    return new Promise(function (resolve, reject) {
      console.log(`cmd on ${dir} work begins`);

      exec(`ls -lR -prune ${dir}`, options, (error, stdout, stderr) => {
      // exec(`find ${dir} -iname "com.apple.syncedpreferences.plist"`, options, (error, stdout, stderr) => {
        if (error) {
          // console.error(`exec error: ${error}`);
          reject(`exec error: ${error}`)
          return;
        }
        // console.log(`stdout: ${stdout}`);
        // console.log(`stderr: ${stderr}`);
        resolve(stdout)
      });
    })
  }

  console.time('async timing')
  Promise.all([
    // cmd('/usr'),
    // cmd('/'),
    // cmd('/Users'),
    cmd('~'),
    cmd('/tmp'),
    cmd('~/Library'),
    cmd('~'),
    cmd('/tmp'),
    cmd('~/Library'),
    cmd('/usr/local/bin'),
    cmd('/usr/local'),
    cmd('/Applications'),
    cmd('/bin'),
  ]).then(function (arrayOfResults) {

    // console.log('final results', arrayOfResults);

    // for (let result of arrayOfResults)
    //   console.log('result', result);

    console.timeEnd('async timing')
  });


}

if (EXPERIMENTS_D) {

  function cmd(dir) {
    return new Promise(function (resolve, reject) {
      console.log(`cmd on ${dir} work begins`);

      try {
        let stdout = execSync(`ls -lR -prune ${dir}`)
        // let stdout = execSync(`find ${dir} -iname "com.apple.syncedpreferences.plist"`)
        resolve(stdout.toString())
        // throw 'myException'; // generates an exception
      }
      catch (e) {
         // statements to handle any exceptions
         reject(e)
         // logMyErrors(e); // pass exception object to error handler
      }

    })
  }

  console.time('sync timing')

  Promise.all([
    // cmd('/usr'),
    // cmd('/'),
    // cmd('/Users'),
    cmd('~'),
    cmd('/tmp'),
    cmd('~/Library'),
    cmd('~'),
    cmd('/tmp'),
    cmd('~/Library'),
    cmd('/usr/local/bin'),
    cmd('/usr/local'),
    cmd('/Applications'),
    cmd('/bin'),
  ]).then(function (arrayOfResults) {

    // console.log('final results', arrayOfResults);

    // for (let result of arrayOfResults)
    //   console.log('result', result);

    console.timeEnd('sync timing')

  },
  function(err) {
    // console.log('Hmm something bad happened', err)
    console.log('Hmm something bad happened')
  });


}
