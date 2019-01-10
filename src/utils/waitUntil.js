module.exports = function(checkInterval, predicate) {
  const timer = setInterval(() => {
    const predicateResult = predicate();
    if (predicateResult) {
      clearInterval(timer);
    }
  }, checkInterval);
}
