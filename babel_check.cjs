const babel = require('@babel/core');
const fs = require('fs');
const content = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

try {
  babel.parse(content, {
    filename: 'EvaluacionDocentePanel.tsx',
    presets: ['@babel/preset-typescript', '@babel/preset-react']
  });
  console.log('No syntax errors found.');
} catch (e) {
  console.error(e.message);
}
