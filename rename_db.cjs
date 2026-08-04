const fs = require('fs');
const path = require('path');

const replacements = [
  { search: /COCKROACH_DB_URL/g, replace: 'DATABASE_URL' },
  { search: /CockroachDB/g, replace: 'PostgreSQL' },
  { search: /cockroachDb/g, replace: 'postgreSql' },
  { search: /cockroach/g, replace: 'postgres' },
  { search: /Cockroach/g, replace: 'Postgres' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        processDirectory(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file === '.env') {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      for (const { search, replace } of replacements) {
        if (search.test(content)) {
          content = content.replace(search, replace);
          modified = true;
        }
      }
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(__dirname);
console.log("Done");
