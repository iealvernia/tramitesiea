const fs = require('fs');
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

const strStart = `                          <div className="md:col-span-8">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nombre / Descripción de la Evidencia</label>
                            <input
                              type="text"
                              value={row.nombre || ''}
                              onChange={(e) => handleEvidenceRowChange(row.id, 'nombre', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Ej: Informe anual de rendimiento académico de grado 5°"
                            />
                          </div>`;

const strEnd = `                              </label>
                            )}
                          </div>`;

if (c.includes(strStart) && c.includes(strEnd)) {
    const startIndex = c.indexOf(strStart);
    // Find the end index of the string block AFTER the start index
    const endIndex = c.indexOf(strEnd, startIndex) + strEnd.length;
    
    const before = c.substring(0, startIndex);
    const after = c.substring(endIndex);
    
    const middle = `                          <div className="md:col-span-12">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nombre / Descripción de la Evidencia</label>
                            <input
                              type="text"
                              value={row.nombre || ''}
                              onChange={(e) => handleEvidenceRowChange(row.id, 'nombre', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Ej: Informe anual de rendimiento académico de grado 5°"
                            />
                          </div>`;
                          
    c = before + middle + after;
    fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c);
    console.log('Successfully removed Anexo 2 upload without touching any braces or divs around it.');
} else {
    console.log('Failed to find start or end block');
}
