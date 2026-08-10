const fs = require('fs');
let c = fs.readFileSync('src/utils/exportAnexo6.ts', 'utf8');

if (!c.includes('const rectorSignature = localStorage.getItem(\'rector_signature_base64\');')) {
    c = c.replace(
      'const logoHtml = customLogo',
      `const rectorName = localStorage.getItem('iea_rector_name') || evalDoc.evaluadorNombre || '';
  const rectorCedula = localStorage.getItem('iea_rector_cedula') || evalDoc.evaluadorCedula || '';
  const rectorSignature = localStorage.getItem('rector_signature_base64') || '';
  const isAprobado = evalDoc.estado === 'Aprobado';

  const logoHtml = customLogo`
    );
}

const oldSignatureTable = `<table style="border: none;">
        <tr>
          <td style="border: none; text-align: center;">
            <br>____________________________________<br>
            Firma del Evaluado<br>
            Nombre: \${teacher.nombre}<br>
            C.C.: \${teacher.cedula}
          </td>
          <td style="border: none; text-align: center;">
            <br>____________________________________<br>
            Firma del Evaluador<br>
            Nombre: \${evalDoc.evaluadorNombre}<br>
            C.C.: \${evalDoc.evaluadorCedula}
          </td>
        </tr>
      </table>`;

const newSignatureTable = `<table style="border: none;">
        <tr>
          <td style="border: none; text-align: center; vertical-align: bottom;">
            <br><br><br>____________________________________<br>
            Firma del Evaluado<br>
            Nombre: \${teacher.nombre}<br>
            C.C.: \${teacher.cedula}
          </td>
          <td style="border: none; text-align: center; vertical-align: bottom;">
            \${isAprobado && rectorSignature ? \`<div style="margin-bottom: 5px; min-height: 55px;"><img src="\${rectorSignature}" width="150" height="50" style="max-height: 50px; max-width: 150px; object-fit: contain; display: block; margin: 0 auto;" /></div>\` : '<br><br><br>'}
            ____________________________________<br>
            Firma del Evaluador\${!isAprobado ? ' (Pendiente de Aprobación)' : ''}<br>
            Nombre: \${isAprobado ? rectorName : '________________________'}<br>
            C.C.: \${isAprobado ? rectorCedula : '_________________'}
          </td>
        </tr>
      </table>`;

if (c.includes(oldSignatureTable)) {
    c = c.replace(oldSignatureTable, newSignatureTable);
    fs.writeFileSync('src/utils/exportAnexo6.ts', c);
    console.log('Successfully updated exportAnexo6 signatures.');
} else {
    console.log('Could not find oldSignatureTable block!');
}
