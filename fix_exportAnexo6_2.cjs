const fs = require('fs');
let c = fs.readFileSync('src/utils/exportAnexo6.ts', 'utf8');

c = c.replace(/wsData\[row\]\[14\] = formatNum\(cf\.puntaje2\);/g, '');

c = c.replace(/let avgScore = 0;\s*if \(cf\.puntaje !== undefined && cf\.puntaje2 !== undefined && !isNaN\(cf\.puntaje\) && !isNaN\(cf\.puntaje2\)\) \{\s*avgScore = \(Number\(cf\.puntaje\) \+ Number\(cf\.puntaje2\)\) \/ 2;\s*\} else \{\s*avgScore = \(Number\(cf\.puntaje\) \|\| 0\) \+ \(Number\(cf\.puntaje2\) \|\| 0\);\s*\}/g,
`let avgScore = Number(cf.puntaje) || 0;`);

c = c.replace(/wsData\[row\]\[14\] = formatNum\(cc\.puntaje2\);/g, '');

c = c.replace(/let avgScore = 0;\s*if \(cc\.puntaje !== undefined && cc\.puntaje2 !== undefined && !isNaN\(cc\.puntaje\) && !isNaN\(cc\.puntaje2\)\) \{\s*avgScore = \(Number\(cc\.puntaje\) \+ Number\(cc\.puntaje2\)\) \/ 2;\s*\} else \{\s*avgScore = \(Number\(cc\.puntaje\) \|\| 0\) \+ \(Number\(cc\.puntaje2\) \|\| 0\);\s*\}/g,
`let avgScore = Number(cc.puntaje) || 0;`);


fs.writeFileSync('src/utils/exportAnexo6.ts', c);
console.log('Fixed exportAnexo6');
