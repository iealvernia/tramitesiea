const fs = require('fs');
const content = fs.readFileSync('e:\\gestión-tramites-alvernia\\src\\App_RecycleBin.tsx', 'utf8');

const searchStr = '{activeTab === \'novedades\' && (';
let startIndex = content.indexOf(searchStr);

// Skip the first one in the header
if (startIndex !== -1) {
    startIndex = content.indexOf(searchStr, startIndex + 1);
}

if (startIndex === -1) throw new Error('No start');

const reportesStr = '{activeTab === \'reportes\' && (';
const endIndex = content.indexOf(reportesStr, startIndex);
if (endIndex === -1) throw new Error('No end');

let extract = content.substring(startIndex, endIndex);
extract = '          ' + extract.trimRight() + '\n\n';

fs.writeFileSync('e:\\gestión-tramites-alvernia\\src\\extracted_jsx.tsx', extract, 'utf8');
console.log('Successfully extracted real UI code! Length:', extract.length);
