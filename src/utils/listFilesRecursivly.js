const path = require('path');
const listFiles = require('./listFiles');

async function listFilesRecursivly(parentDir, checkCallback, depth) {
  const canGoDeeper = depth === undefined || depth > 0;

  let files = await listFiles(parentDir, checkCallback);

  files = files.map(async (file) => {
    if (!file.isDir) {
      return [file];
    } else if (canGoDeeper) {
      return await listFilesRecursivly(file.file, checkCallback, depth ? depth - 1 : undefined);
    } else {
      return [];
    }
  });
  files = await Promise.all(files);
  files = files.flat(1);

  return files;
}

module.exports = async (parentDir, checkCallback, depth) => {
  const wrapperCheckCallback = (file, isDir) => {
    const relativeFileName = path.relative(parentDir, file);
    return checkCallback(relativeFileName, isDir);
  }

  let files = await listFilesRecursivly(parentDir, wrapperCheckCallback, depth);
  files = files.map(file => {
    file = file.file;
    return path.relative(parentDir, file);
  });
  return files;
};
