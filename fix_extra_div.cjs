const fs = require('fs');
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

const findBlock = `                          {/* Attachment management (removed) */}
                          </div>`;
const replaceBlock = `                          {/* Attachment management (removed) */}`;

if (c.includes(findBlock)) {
    c = c.replace(findBlock, replaceBlock);
    fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c);
    console.log('Fixed extra div!');
} else {
    console.log('Could not find the target block');
}
