const fs = require('fs');
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

const regex = /<div className="md:col-span-8">([\s\S]*?)<\/div>\s*\{\/\* Attachment management \*\/}[\s\S]*?className="hidden"\s*\/>\s*<\/label>\s*\)}/g;

c = c.replace(regex, `<div className="md:col-span-12">$1</div>
                          {/* Attachment management (removed) */}`);

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c);
console.log('Removed anexo2 upload successfully');
