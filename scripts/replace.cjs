const fs = require('fs');
const glob = require('glob');

const replaceInFile = (file) => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('gemini-3-flash-preview')) {
    fs.writeFileSync(file, content.replace(/gemini-3-flash-preview/g, 'gemini-2.5-flash'));
    console.log(`Replaced in ${file}`);
  }
};

glob.sync('{src,backend}/**/*.{ts,tsx,prompt}').forEach(replaceInFile);
