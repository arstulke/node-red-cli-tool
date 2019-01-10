const fs = require('fs');

module.exports = async function(filename, payload, encoding) {
    return new Promise((resolve, reject) => {
        const callback = (err, val) => {
            if (err) {
                reject(err);
            } else {
                resolve(val);
            }
        };

        if (encoding) {
            fs.writeFile(filename, payload, encoding, callback);
        } else {
            fs.writeFile(filename, payload, callback);
        }
    });
}
