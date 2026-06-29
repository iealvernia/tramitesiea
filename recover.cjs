const fs = require('fs');
const diff = fs.readFileSync('e:/gestión-tramites-alvernia/src/App_diff.txt', 'utf8');
const lines = diff.split('\n');
let recovered = [];
for (let line of lines) {
    if (line.startsWith('-')) {
        // Remove the first character (the minus sign)
        recovered.push(line.substring(1));
    }
}
fs.writeFileSync('e:/gestión-tramites-alvernia/src/App_recovered_logic.tsx', recovered.join('\n'), 'utf8');
