'use strict'

const spawn = require('child_process').spawn
const exec = require('child_process').exec
const execSync = require('child_process').execSync

// EXPERIMENTS

const EXPERIMENTS_A = false
const EXPERIMENTS_B = false
const EXPERIMENTS_C = false    // async 10-14 seconds
const EXPERIMENTS_D = false   // sync  23-30 seconds - double the time!
const EXPERIMENTS_E = true

// EXPERIMENTS_A

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

if (EXPERIMENTS_A) {
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


// EXPERIMENTS_C

function cmd_c(dir) {
  return new Promise(function (resolve, reject) {
    console.log(`cmd on ${dir} work begins`);

    const options = {
      encoding: 'utf8',
      timeout: 0,
      maxBuffer: 880000*1024,  // increased this
      killSignal: 'SIGTERM',
      cwd: null,
      env: null
    }

    exec(`find ${dir} ! -iname "[a-y]*"`, options, (error, stdout, stderr) => {
    // exec(`ls -lR -prune ${dir}`, options, (error, stdout, stderr) => {
    // exec(`find ${dir} -iname "com.apple.syncedpreferences.plist"`, options, (error, stdout, stderr) => {
      if (error) {
        // console.error(`exec error: ${error}`);
        reject(`exec error: ${error}`)
        return;
      }
      // console.log(`stdout: ${stdout}`);
      // console.log(`stderr: ${stderr}`);
      console.log(`stdout: ${stdout.length}`);
      resolve(stdout)
    });
  })
}

if (EXPERIMENTS_C) {

  console.time('async timing')
  Promise.all([
    cmd_c('/Applications'),
    cmd_c('/bin'),
    cmd_c('/Applications'),
    cmd_c('/bin'),
    cmd_c('/Applications'),
    cmd_c('/bin'),
  ]).then(function (arrayOfResults) {

    // console.log('final results', arrayOfResults);

    // for (let result of arrayOfResults)
    //   console.log('result', result);

    console.timeEnd('async timing')
  });


}


// EXPERIMENTS_D

function cmd_d(dir) {
  return new Promise(function (resolve, reject) {
    console.log(`cmd on ${dir} work begins`);

    try {
      let stdout = execSync(`find ${dir} ! -iname "[a-y]*"`)
      // let stdout = execSync(`ls -lR -prune ${dir}`)
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

if (EXPERIMENTS_D) {

  console.time('sync timing')

  Promise.all([
    // cmd('/usr'),
    // cmd('/'),
    // cmd('/Users'),
    cmd_d('/Applications'),
    cmd_d('/bin'),
    cmd_d('/Applications'),
    cmd_d('/bin'),
    cmd_d('/Applications'),
    cmd_d('/bin'),
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


if (EXPERIMENTS_E) {

  const {run_async} = require('../run_async.js')

  // this.result_shell_ls = spawn('ls', ['-lh', this.path])
  // this.result_shell_version = spawn(this.path, ['--version'])
  // this.result_shell_file_size = spawn('wc', ['-c', this.path])

  console.time('sync timing')

  Promise.all([
    run_async('ls', ['-lh', '/usr/bin/python']),
    run_async('ls', ['-lh', '/usr/local/bin/python']),
    run_async('ls', ['-lh', '/usr/local/bin/pip']),
    run_async('/usr/bin/python', ['--version']),
    run_async('/usr/local/bin/python', ['--version']),
    run_async('/usr/local/bin/pip', ['--version']),
    run_async('wc', ['-c', '/usr/bin/python']),
    run_async('wc', ['-c', '/usr/local/bin/python']),
    run_async('wc', ['-c', '/usr/local/bin/pip']),
    run_async('which', ['python']),
    run_async('which', ['pip']),
  ]).then(function (arrayOfResults) {

    console.log('final results', arrayOfResults);

    // for (let result of arrayOfResults)
    //   console.log('result', result);

    console.timeEnd('sync timing')

  }).catch(function (err) {
     console.log("Promise Rejected", err.syscall);
  })

}


