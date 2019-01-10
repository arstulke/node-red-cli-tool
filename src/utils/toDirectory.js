const path = require('path');

module.exports = (filename) => {
  return path.dirname(filename);
}
