const path = require('path');

module.exports = function() {
  const args = Array.from(arguments);
  const pathOfExecution = process.env.PWD;
  const arr = [pathOfExecution, ...args];
  const resolvedPath = path.resolve(...arr);
  return resolvedPath;
}
