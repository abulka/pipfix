const spawn = require('child_process').spawn

function run_async(cmd, params) {
  return new Promise(function (resolve, reject) {
    // console.log(`async spawn ${cmd} ${params} work begins`);

    let stdout = ''
    let stderr = ''

    // asynchronous version returns an object where .stdout is not a value but something you attach an event to
    const _cmd = spawn(cmd, params);

    _cmd.stdout.on('data', (data) => { stdout = data.toString() });
    _cmd.stderr.on('data', (data) => { stderr = data.toString() });
    _cmd.on('close', (code) => {
      // console.log(`async spawn child process exited with code ${code}`)
      let result = {stdout: stdout,
                    stderr: stderr,
                    args: [cmd, ...params],
                    code: code}
      resolve(result)
    });
    _cmd.on('error', (err) => {
      // console.log('async spawn error', err, err.code, err.syscall, stderr);
      // console.log('async spawn error', stderr);

      // Check if its actually a bad error - non existent exe is not a fatal error as far as pipfix probing is concerned
      if (err.code == 'ENOENT') {
        let result = {stdout: '',
                      stderr: `${err.path}: No such file or directory`,
                      args: [cmd, ...params],
                      code: 1}
        resolve(result)
      }
      else
        reject(err)

    });
  })
}

exports.run_async = run_async

