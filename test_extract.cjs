const fs = require('fs');
let updateScript = fs.readFileSync('update_teacher_anexo6.cjs', 'utf8');
let p4Code = updateScript.split('const replacementLines = ')[1].split(';\n\nconst lines')[0];
fs.writeFileSync('test_output.txt', p4Code);
