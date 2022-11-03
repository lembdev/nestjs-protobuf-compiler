const { ESLint } = require('eslint');

const removeIgnoredFiles = async (files) => {
  const eslint = new ESLint();
  const isIgnored = await Promise.all(
    files.map((file) => eslint.isPathIgnored(file)),
  );

  return files.filter((_, i) => !isIgnored[i]).join(' ');
};

module.exports = {
  '**/*.ts': async (files) => {
    const filtredFiles = await removeIgnoredFiles(files);
    return [
      `prettier --ignore-unknown --write  ${files}`,
      `eslint --max-warnings=0 ${filtredFiles}`,
    ];
  },
};
