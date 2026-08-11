const fs = require('fs');
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

c = c.replace(/<div className="md:col-span-8">([\s\S]*?)<\/div>\s*\{\/\* Attachment management \*\/\}[\s\S]*?className="hidden"\s*\/>\s*<\/label>\s*\)\}\s*<\/div>/g, 
`<div className="md:col-span-12">$1</div>`);

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c);
console.log('Removed anexo2 upload successfully with regex.');
