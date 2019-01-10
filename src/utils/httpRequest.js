const fetch = require('node-fetch');

module.exports = async function(method, url, headers, body, noStringify) {
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
