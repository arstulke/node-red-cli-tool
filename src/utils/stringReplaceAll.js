function replaceAll(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

String.prototype.replaceAll = replaceAll;
module.exports = replaceAll;
