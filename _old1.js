'use strict';
var exec = require('child_process').exec;

// exec('node -v', function(error, stdout, stderr) {
//     console.log('stdout: ' + stdout);
//     console.log('stderr: ' + stderr);
//     if (error !== null) {
//         console.log('exec error: ' + error);
//     }
// });
//

// exec('python -m site', function(error, stdout, stderr) {
//     console.log('stdout: ' + stdout);
//     console.log('stderr: ' + stderr);
//     if (error !== null) {
//         console.log('exec error: ' + error);
//     }
// });

// this runs asynchronously, and calls the function when complete - which could be much later.
// exec('pip --version', function(error, stdout, stderr) {
//     console.log('stdout: ' + stdout);
//     console.log('stderr: ' + stderr);
//     if (error !== null) {
//         console.log('exec error: ' + error);
//     }
// });

console.log('--------')



const
    spawn = require( 'child_process' ).spawnSync,
    ls = spawn( 'ls', [ '-lh', '/usr' ] );

console.log( `stderr: ${ls.stderr.toString()}` );
console.log( `stdout: ${ls.stdout.toString()}` );

// function run_cmd(cmd, args, callBack ) {
//     var spawn = require('child_process').spawn;
//     var child = spawn(cmd, args);
//     var resp = "";
//
//     child.stdout.on('data', function (buffer) { resp += buffer.toString() });
//     child.stdout.on('end', function() { callBack (resp) });
// } // ()
//
// run_cmd( "ls", ["-l"], function(text) { console.log (text) });
//
// run_cmd( "hostname", [], function(text) { console.log (text) });


// exec('pip --version', {silent:false, async:false})

// var version = exec('node --version', {silent:true}).stdout;

// var pip1 = exec('pip --version', {silent:true}).stdout;
// var pip1 = exec('pip --version', {silent:false, async:false}).stdout;
// var pip1 = exec('pip --version', {silent:false, async:false});

// console.log('node --version', version)
// console.log('pip info', pip1.stdout)

console.log('DONE ')
