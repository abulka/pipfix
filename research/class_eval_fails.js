'use strict';

//let context = {'x':1, 'y':2}
var context = { a: 1, b: 2, c: 3 };
let zz = 100

var result = function(str){
  return eval(str);
}.call(context,'1+1+this.a')

console.log('result', result)
console.log('this', this)

return

// ------------------------------

class BaseSpawnMockBehaviour{

  // ...

  static make_mock_spawn_func(HelperClass) {
    // Returns mock version of 'spawn' function acting in accordance with the logic in 'HelperClass' which if
    // not defined, defaults to the class upon which the static method is called.
    // Note: closure technology in use - returns a function 'my_spawn' closed over 'HelperClass'
    // but which takes 'cmd', 'param_array' as params, just like the real spawn and spawnSync do.
    console.log('in', this.prototype, typeof (this.prototype), this.prototype.constructor.name, typeof this.prototype.constructor.name)

    if (HelperClass == undefined)
      HelperClass = this.prototype.constructor.name  // in a static method 'this' refers to the class not the instance

    function my_spawn(cmd, param_array) {
      eval(`let o = new ${HelperClass}(cmd, param_array)`)
      // let o = new HelperClass(cmd, param_array)
      return o.process_possible_commands()
    }
    return my_spawn
  }

}

class SpawnMock extends BaseSpawnMockBehaviour {
    // ...
}

let f = SpawnMock.make_mock_spawn_func()

/*

  1) default python detection brain finds /usr/bin and /usr/local/bin python:
     ReferenceError: SpawnMock is not defined

*/

// seems that the eval cannot get the scope of where SpawnMock class has been defined?

