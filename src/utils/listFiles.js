const fs = require('fs');
const path = require('path');

function createCallbackForPromise(resolve, reject) {
  return (err, value) => {
    if (err) {
      reject(err);
    } else {
      resolve(value);
    }
  };
}

async function listFiles(dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, createCallbackForPromise(resolve, reject));
  });
};

async function isDir(file) {
  const stat = await new Promise((resolve, reject) => {
    fs.stat(file, createCallbackForPromise(resolve, reject));
  });
  return stat.isDirectory();
};

module.exports = async (dir, checkCallback) => {
  let files = await listFiles(dir);
  files = files.map(async (file) => {
    file = path.resolve(dir, file);
    const isDirProp = await isDir(file);

    return {
      file: file,
      isDir: isDirProp
    };
  });
  files = await Promise.all(files);
  files = files.filter(file => {  return checkCallback(file.file, file.isDir); });
  return files;
}
