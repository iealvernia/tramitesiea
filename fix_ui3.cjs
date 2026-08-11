const fs = require('fs');
let content = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

// Fix headers
content = content.replace(
  '<th className="px-4 py-2 w-1/12 text-center">1ra Val.</th>\n                        <th className="px-4 py-2 w-1/12 text-center">2da Val.</th>',
  '<th className="px-4 py-2 w-2/12 text-center">PUNTAJE (1-100)</th>'
);
content = content.replace(
  '<th className="px-4 py-2 w-1/6 text-center">1ra Val.</th>\n                        <th className="px-4 py-2 w-1/6 text-center">2da Val.</th>',
  '<th className="px-4 py-2 w-2/6 text-center">PUNTAJE (1-100)</th>'
);

// Delete puntaje2 td in functional
content = content.replace(
  /<td className="px-4 py-2">\s*<input type="number" step="0\.1" max="100" value={comp\.puntaje2 \|\| ''} onChange={\(e\) => {\s*const newArr = \[\.\.\.activeEvaluacion\.compromisosFuncionales\];\s*newArr\[idx\] = { \.\.\.newArr\[idx\], puntaje2: Number\(e\.target\.value\) };\s*setActiveEvaluacion\({ \.\.\.activeEvaluacion, compromisosFuncionales: newArr }\);\s*}} className="w-16 mx-auto px-2 py-1 border rounded text-center text-xs" \/>\s*<\/td>/g,
  ''
);

// Delete puntaje2 td in comportamental
content = content.replace(
  /<td className="px-4 py-2">\s*<input type="number" step="0\.1" max="100" value={comp\.puntaje2 \|\| ''} onChange={\(e\) => {\s*const newArr = \[\.\.\.activeEvaluacion\.compromisosComportamentales\];\s*newArr\[idx\] = { \.\.\.newArr\[idx\], puntaje2: Number\(e\.target\.value\) };\s*setActiveEvaluacion\({ \.\.\.activeEvaluacion, compromisosComportamentales: newArr }\);\s*}} className="w-16 mx-auto px-2 py-1 border rounded text-center text-xs" \/>\s*<\/td>/g,
  ''
);

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', content, 'utf8');
console.log('Restored UI fixes');
