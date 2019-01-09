const waitUntil = require('./waitUntil');

function isPromise(promise) {
  return promise && typeof promise.then === 'function';
}

async function wrapPromise(promise) {
  if (promise !== undefined && !isPromise(promise)) {
    promise = Promise.resolve(promise);
  }

  if (promise !== undefined) {
    try {
      const value = await promise;
      if (value !== undefined) {
        console.log(value);
      }
    } catch (err) {
      console.error("Got error while executing script.");
      console.error(err);
    }
  }
}

module.exports = function() {
  const args = process.argv.slice(2);
  const scriptName = args[0];
  const scriptArgs = args.slice(1);

  const scriptFunction = require('./scripts/' + scriptName);
  const ret = scriptFunction(scriptArgs);

  let finished = false;
  const promise = wrapPromise(ret)
    .then(() => {
      finished = true;
    });

  waitUntil(100, () => {
    return finished;
  });
}
