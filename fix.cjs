const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace fetch('/api/...') with fetch(`${import.meta.env.VITE_API_URL || ''}/api/...`)
  content = content.replace(/fetch\s*\(\s*['"]\/api\//g, 'fetch(`${import.meta.env.VITE_API_URL || \'\'}/api/');

  // Replace fetch(`/api/...`) with fetch(`${import.meta.env.VITE_API_URL || ''}/api/...`)
  content = content.replace(/fetch\s*\(\s*`\/api\//g, 'fetch(`${import.meta.env.VITE_API_URL || \'\'}/api/');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
  }
}

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const srcFiles = walkSync('src');
srcFiles.forEach(fixFile);
