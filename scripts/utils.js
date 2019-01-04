const fs = require('fs');
const fetch = require('node-fetch');

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

async function readFileAsync(filename) {
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

async function writeFileAsync(filename, payload, encoding) {
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

async function httpRequest(method, url, headers, body, noStringify) {
    const options = {
        method: method,
        headers: headers,
    };
    if (body) {
        if (typeof body === 'object' && !noStringify) {
            body = JSON.stringify(body);
        }
        options.body = body;
    }
    return await fetch(url, options);
}

function getArgs() {
    const args = process.argv.slice(2);
    return {
        'project': args.length > 0 ? args[0] : undefined,
        'stage': args.length > 1 ? args[1] : undefined
    };
}

function toUrlEncoded(element, key, list) {
    var list = list || [];
    if (typeof (element) == 'object') {
        for (var idx in element)
            toUrlEncoded(element[idx], key ? key + '[' + idx + ']' : idx, list);
    } else {
        list.push(key + '=' + encodeURIComponent(element));
    }
    return list.join('&');
}

module.exports.readFileAsync = readFileAsync;
module.exports.writeFileAsync = writeFileAsync;
module.exports.httpRequest = httpRequest;
module.exports.getArgs = getArgs;
module.exports.toUrlEncoded = toUrlEncoded;