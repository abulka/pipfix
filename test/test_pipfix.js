let {Python, Pip, Which} = require('../lib.js')

var assert = require('assert');  // https://nodejs.org/api/assert.html
var should = require('should');  // https://github.com/shouldjs/should.js

// to run
// ./node_modules/mocha/bin/mocha

describe('python existence', function() {  // npm install --save-dev mocha

  describe('one system python only', function() {
    it('should return true', function() {

      let python_usr_bin = new Python('/usr/bin/python')

      assert.equal(python_usr_bin.path, '/usr/bin/python');
    });
  });


});

