const fs = require('fs');
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

if (!c.includes("import { generarAnexo6Word }")) {
    c = c.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { generarAnexo6Word } from '../utils/exportAnexo6';");
}

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c);
console.log('Fixed imports in EvaluacionDocentePanel');

let e6 = fs.readFileSync('src/utils/exportAnexo6.ts', 'utf8');
e6 = e6.replace("import { Evaluacion1278, DocenteEvaluacion } from '../types';", "import { Evaluacion1278, DocenteEvaluacion } from '../components/EvaluacionDocentePanel';");
fs.writeFileSync('src/utils/exportAnexo6.ts', e6);
console.log('Fixed imports in exportAnexo6');
