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

module.exports = toUrlEncoded;
