module.exports = (plaintext) => {
  return Buffer.from(plaintext, "utf8").toString("base64");
};
