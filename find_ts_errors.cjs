const fs = require('fs');
const content = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

// Use a simple regex to extract all JSX tags from line 4118 to 7788
const lines = content.split('\n').slice(4117, 7788);

let stack = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // skip commented lines
  if (line.trim().startsWith('//') || line.trim().startsWith('{/*')) continue;
  
  const matches = line.match(/<\/?([a-zA-Z0-9]+)[^>]*>/g);
  if (!matches) continue;
  
  for (const match of matches) {
    if (match.endsWith('/>')) continue;
    const isClosing = match.startsWith('</');
    const tagName = match.match(/<\/?([a-zA-Z0-9]+)/)[1];
    if (['input', 'img', 'br', 'hr', 'path', 'svg', 'textarea'].includes(tagName.toLowerCase())) continue;
    
    if (isClosing) {
      if (stack.length === 0) {
         console.log('Unmatched closing tag', tagName, 'at line', i + 4118);
      } else {
         const last = stack.pop();
         if (last.tagName !== tagName) {
           console.log('Mismatched tag at line', i + 4118, ': expected', last.tagName, 'got', tagName);
           console.log('Stack is currently', stack.map(s => s.tagName).join(' '));
           process.exit();
         }
      }
    } else {
      stack.push({ tagName, line: i + 4118 });
    }
  }
}

if (stack.length > 0) {
  console.log('Unclosed tags:', stack);
} else {
  console.log('All tags balanced.');
}
