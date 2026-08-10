const fs = require('fs');
const content = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

let stack = [];
let line = 1;
let i = 0;
while (i < content.length) {
  let char = content[i];
  if (char === '\n') line++;
  
  if (char === '/' && content[i+1] === '/') {
    while (i < content.length && content[i] !== '\n') { i++; }
    continue;
  }
  if (char === '/' && content[i+1] === '*') {
    i += 2;
    while (i < content.length && !(content[i] === '*' && content[i+1] === '/')) {
      if (content[i] === '\n') line++;
      i++;
    }
    i += 2;
    continue;
  }
  if (char === "'" || char === '"' || char === '\') {
    let quote = char;
    i++;
    while (i < content.length && content[i] !== quote) {
      if (content[i] === '\\\\') i++;
      if (content[i] === '\n') line++;
      i++;
    }
  }
  
  if (char === '(' || char === '{' || char === '[') {
    stack.push({ char, line });
  } else if (char === ')' || char === '}' || char === ']') {
    if (stack.length === 0) {
      console.log('Unmatched', char, 'at line', line);
      process.exit(0);
    }
    let last = stack.pop();
    let map = { ')': '(', '}': '{', ']': '[' };
    if (last.char !== map[char]) {
      console.log('Mismatched', char, 'at line', line, 'expected', map[char], 'to close', last.char, 'from line', last.line);
      process.exit(0);
    }
  }
  i++;
}
console.log('Stack length:', stack.length);
