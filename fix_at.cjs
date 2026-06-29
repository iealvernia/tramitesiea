const fs = require('fs');
let app = fs.readFileSync('e:\\gestión-tramites-alvernia\\src\\App.tsx', 'utf8');

// Find the line that has exactly `"@` and remove it
const lines = app.split('\n');
const filtered = lines.filter(l => l.trim() !== '"@');
fs.writeFileSync('e:\\gestión-tramites-alvernia\\src\\App.tsx', filtered.join('\n'), 'utf8');
console.log('Removed @ string');
