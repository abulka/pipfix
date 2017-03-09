/*
Andy musings on how promises work
 */

function work1() { console.log('work1'); return 5 }

// A promise is an object that does some work and holds a final 'result' - you must create an instance of a promise
// The work it does is defined by the function (the executor function) you pass in as a parameter to the Promise constructor
// which takes 'resolve' and 'reject' functions as parameters - you don't need to define these -
// simply declare them in your executor function.
// Executor function code runs straight away!  A promise is 'resolved' by your promise work code calling the resolve(result) function.
//
// Optionally, call .then(onFulfilled) on a promise object and the promise technology will auto-call onFulfilled(result)
// if its a resolved promise.  You can in fact call .then(onFulfilled) repeatedly on the same promise object,
// for fun to get the 'result'.  Actually more seriously, this is the only way to extract the result  - there is no result property.
//
// Note that your executor function calling the resolve(result) function is different to the promise object calling your
// onFulfilled(result) success function when you invoke .then(onFulfilled) - its not the same callback/wiring.
// Remember that the promise object
// holds the official 'result' value internally as a result of you calling resolve(result) - and the promise object notifies
// anyone who wants to know the result via the .then(onFulfilled) mechanism.  Thus, two entirely different callbacks.

// EXPERIMENTS

const EXPERIMENTS_A = false
const EXPERIMENTS_B = false
const EXPERIMENTS_C = false
const EXPERIMENTS_D = false
const EXPERIMENTS_E = false
const EXPERIMENTS_F = true

if (EXPERIMENTS_A) {
  // 00. Simplest example, ignoring parameters, and no .then() method - functionality runs immediately
  new Promise(function() { console.log('00 I run immediately') })

  // 01. By adding a .then method we are providing the infrastructure for the promise to call a success callback.
  // But our functionality happens not to call resolve() - thus the then() code here is useless and never gets called.
  // Success callbacks will only get called if the promise is 'resolved' - which it isn't here.
  new Promise(function() { console.log('01 I run but am not calling the success cb.')  }).then( ()=>{console.log('01 never called')} )

  // 02. Same example, now properly notifying the resolve callback function when done.  Note the resolve method is a
  // parameter to the executor function
  let p02 = new Promise(function(resolve) { work1(); resolve() }).then( ()=>{console.log('02 resolved')} )
  // For fun, you can call .then as many times as you like to extract the result, though in this case
  p02.then( ()=>{console.log('02 resolved, for sure')} )

  // 03. Actually pass a bit more info to the resolve callback - ** this is how you pass the official 'result' of long running work
  let p03 = new Promise(function(resolve) { let result = work1(); resolve(result) })
  p03.then( (result)=>{console.log('03 resolved, otherwise this success callback would not have been called, got', result)} )
  // I wonder if the promise is officially resolved?  Yes.
  p03.then( (result)=>{console.log('03 checking result again got', result)} )
  p03.then( (result)=>{console.log('03 checking result again2 got', result)} )

  // 03a. Watch out re what is assigned to your variables!  I think p03a variable contains result of a .then() and not the
  // original promise!  Moral: either chain and never re-call .then() again or be very clear re your variable assignments.
  let p03a = new Promise(function(resolve) { let result = work1(); resolve(result) }).then( (result)=>{console.log('03a resolved, got', result)} )
  p03a.then( (result)=>{console.log('03a checking result again got', result,
                                    '- cos p03a var is not the original promise',
                                    p03a, typeof p03a)} )

  // 04. Immediately resolved promise objects mean they have already done their work and their result is e.g. 42
  // They will still call stuff via a .then() method at a later date - in fact you can trigger .then() as many times as you like.
  // But of course their internal work is immutable and cannot be redone.
  let p04 = Promise.resolve(42);  // 42 is the 'result'
  p04.then((result)=>{console.log('04 done, got', result)})
  p04.then((result)=>{console.log('04 reminder, done, got', result)})

  // 05. Chaining - the trick here is to make your .then()'s success function return another promise.  This then feeds into the
  // 'result' parameter of the next success function in the chain
  // If you don't do this, the .then() chaining still works and all runs, but the result values will be undefined
  let p05 = Promise.resolve(43);
  p04.then((result)=>{console.log('05 chain, p04 done, got', result); return p05})  // p05 gets fed into .then((result) on next line
     .then((result)=>{console.log('05 chain, p05 done, got', result)})

  // 05a. Note that in this chain, the first success handler does not return anything, resulting in the second
  // success handler getting 'undefined' as its result.  Not good.
  p04.then((result)=>{console.log('05a chain2, p04 done, got', result)})  // nothing returned thus undefined gets fed into .then((result) on next line
     .then((result)=>{console.log('05a chain2, p05 done, got', result)})
}

if (EXPERIMENTS_B) {

  // 06. & 07. Chaining
  // Hmmm - if defining a promise executes it immediately, how are we to control execution in a chain?  You cannot!!
  // Note how 07 work begins before 06 work, because that's the order of the code.
  // The promises execute in parallel, as soon as you define them.  But at least the checking of the result in a chain
  // can be controlled, I suppose.

  let p07 = new Promise(function(resolve) { console.log('07 work begins'); setTimeout(function() { resolve("07 timeout success!") }, 200) })
  let p06 = new Promise(function(resolve) { console.log('06 work begins'); setTimeout(function() { resolve("06 timeout success!") }, 500) })
  p06.then((result)=>{ console.log('06 done, got', result); return p07 })
     .then((result)=>{ console.log('07 done, got', result)})
}

if (EXPERIMENTS_C) {
  // 08. & 09. Chaining
  // You must use 'new Promise' to create a promise, thus pre-defining promises will always cause them to execute
  // and not in a controlled order, asynchronously.  Yikes.  Let's try defining the next promise inside the success
  // callbacks of the previous promise...hmmm - YES it works, but looks ugly and are we actually taking advantage of
  // any asynchronous work being done?

  new Promise(function (resolve) {
    console.log('08 work begins');
    setTimeout(function () {
      resolve("08 timeout success!")
    }, 250)
  }).then((result) => {
    console.log('08 done, got', result);

    // Here is where we create the next promise
    new Promise(function (resolve) {
      console.log('09 work begins');
      setTimeout(function () {
        resolve("09 timeout success!")
      }, 250)
    }).then((result) => {
      console.log('09 done, got', result);
    })
  })
}

if (EXPERIMENTS_D) {
  // Nicer way, but where is the async parallel advantages - there are none, but at least its coordinated.

  function ten() {
    return new Promise(function (resolve) {
      console.log('10 work begins');
      setTimeout(function() { resolve("10 success!") }, 250)
    })
  }
  function eleven(info) {
    return new Promise(function (resolve) {
      console.log('11 work begins using info', info);
      setTimeout(function() { resolve("11 success!") }, 250)
    })
  }

  ten()
    .then((result) => { return eleven(result) })
    .then((result) => { console.log('11 done, result=', result )})

}

if (EXPERIMENTS_E) {

  /*
   More chaining.

   Each then returns a new promise.  Except for the last one.
   When a value is simply returned from within a then lambda, it will effectively
   return Promise.resolve(<value returned by whichever handler was called>).
   see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then
   */

  // Return a promise which resolves after the specified interval
  function delay(interval) {
    return new Promise(function (resolve) {
      setTimeout(resolve, interval);
    });
  }

  delay(1000)
    .then(function () {
      console.log('first delay in chain complete');
      return delay(1000);
    })
    .then(function () {
      console.log('second delay in chain complete');
      return delay(250);
    })
    .then(function () {
      console.log('third delay in chain complete');
      return 5;
    })
    .then(function (value) {
      console.log('final value is not a promise, just a value', value); // 5
    });
}

if (EXPERIMENTS_F) {

  /*
   Promise.all is amazing. What it accomplishes is so painful using callbacks that I chickened out from even writing a
   callback-based example, yet the abstraction it provides is so simple.

   What does it do? It returns a promise which resolves when all of it’s argument promises have resolved, or is rejected
   when any of it’s argument promises are rejected. The returned promise resolves to an array containing the results of
   every promise, or fails with the error with which the first promise was rejected.

   Promise.all([
     parallelAnimation1(),
     parallelAnimation2()
   ]).then(function() {
     finalAnimation();
   });
   */

  function parallelAnimation1() {
    return new Promise(function (resolve) {
      console.log('parallelAnimation1 work begins');
      setTimeout(function() { resolve("parallelAnimation1 success!") }, 250)
    })
  }
  function parallelAnimation2() {
    return new Promise(function (resolve) {
      console.log('parallelAnimation2 work begins');
      setTimeout(function() { resolve("parallelAnimation2 success!") }, 1250)
    })
  }

  function finalAnimation(values) {
      console.log('finalAnimation work begins using values', values)
  }

  Promise.all([
    parallelAnimation1(),
    parallelAnimation2()
  ]).then(function (arrayOfResults) {
    finalAnimation(arrayOfResults);
  });

}

