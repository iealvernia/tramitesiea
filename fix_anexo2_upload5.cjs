const fs = require('fs');
let lines = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8').split('\n');

// Verify we are editing the right lines
if (lines[5732].includes('md:col-span-8') && lines[5743].includes('Attachment management') && lines[5783].includes('</div>')) {
  lines[5732] = '                          <div className="md:col-span-12">';
  lines.splice(5742, 42);
  fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', lines.join('\n'), 'utf8');
  console.log("Successfully removed Anexo 2 upload.");
} else {
  console.log("Line mismatch, not editing:");
  console.log("5732: " + lines[5732]);
  console.log("5743: " + lines[5743]);
  console.log("5783: " + lines[5783]);
}
