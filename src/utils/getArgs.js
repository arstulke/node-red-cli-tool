module.exports = function(args) {
    return {
        'project': args.length > 0 ? args[0] : undefined,
        'stage': args.length > 1 ? args[1] : undefined
    };
}
