const fs = require('fs');
let appContent = fs.readFileSync('e:\\gestión-tramites-alvernia\\src\\App.tsx', 'utf8');
const jsxExtracted = fs.readFileSync('e:\\gestión-tramites-alvernia\\src\\extracted_jsx.tsx', 'utf8');

const startStr = '{activeTab === "novedades" && (';
const startIndex = appContent.indexOf(startStr);

let endStr = '{activeTab === "reportes"';
let endIndex = appContent.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const before = appContent.substring(0, startIndex - 10);
  const after = appContent.substring(endIndex - 10);

  const finalContent = before + jsxExtracted + after;
  fs.writeFileSync('e:\\gestión-tramites-alvernia\\src\\App.tsx', finalContent, 'utf8');
  console.log('App.tsx successfully merged!');
} else {
  console.log('Could not find boundaries in App.tsx', startIndex, endIndex);
}
