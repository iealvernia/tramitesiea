const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('ensureDbTables')) {
    console.log(`${i + 1}: ${line}`);
  }
});
