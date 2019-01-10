const fs = require('fs');

module.exports = async function(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, val) => {
            if (err) {
                reject(err);
            } else {
                resolve(val);
            }
        });
    });
}
