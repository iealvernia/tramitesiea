const fs = require('fs');

let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

// 1. Add Anexo 6 to state
c = c.replace(/useState<1 \| 2 \| 3>\(1\)/g, 'useState<1 | 2 | 3 | 4>(1)');

// 2. Add import
if (!c.includes('generarAnexo6Word')) {
  c = c.replace('import { checkIsHabilitated }', "import { generarAnexo6Word } from '../utils/exportAnexo6';\nimport { checkIsHabilitated }");
}

// 3. Add handleExportWordAnexo6
const searchFunc = '  const handleExportWordAnexo5 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {';
const replaceFunc = `  const handleExportWordAnexo6 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {
    const customLogo = localStorage.getItem('iea_custom_logo') || '';
    generarAnexo6Word(evalDoc, teacher, institutionName, customLogo);
  };
  
  const handleExportWordAnexo5 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {`;
if (!c.includes('handleExportWordAnexo6')) {
  c = c.replace(searchFunc, replaceFunc);
}

// 4. Splice in Anexo 6 UI
const uiBlock = `          {selectedPeriod === 4 && activeEvaluacion && (
              <div className="space-y-6 animate-fade-in" id="portal-anexo6-view">
                <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm font-sans flex flex-col text-left">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-lg uppercase tracking-wide mb-1">Evaluación Final (Anexo 6)</h4>
                      <p className="text-sm text-slate-500 max-w-xl">
                        Ingrese su autoevaluación (calificación apreciativa) para cada competencia. Al finalizar, envíe el formulario para revisión del Rector.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const emp = docentesEvaluacion.find(e => e.cedula === currentTeacher?.cedula);
                        if (emp) handleExportWordAnexo6(activeEvaluacion, emp);
                      }}
                      className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl uppercase tracking-widest text-xs shadow-md shadow-blue-500/20 transition-colors flex items-center gap-2"
                    >
                      Descargar Anexo 6 (Borrador)
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Funcionales */}
                    <div className="space-y-4">
                      <h5 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Competencias Funcionales (70%)</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider">
                              <th className="p-3 font-bold border-b border-slate-200">Competencia</th>
                              <th className="p-3 font-bold border-b border-slate-200 w-32">Puntaje (1-100)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {activeEvaluacion.compromisosFuncionales.map((cf, i) => (
                              <tr key={'f_'+i} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3">
                                  <div className="font-bold text-slate-800">{cf.competencia}</div>
                                  <div className="text-[10px] text-slate-500 line-clamp-1">{cf.area}</div>
                                </td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    min="1" max="100"
                                    disabled={activeEvaluacion.estado === 'Enviado' || activeEvaluacion.estado === 'Aprobado'}
                                    value={cf.puntaje || 0}
                                    onChange={(e) => {
                                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                      const updatedFuncs = [...activeEvaluacion.compromisosFuncionales];
                                      updatedFuncs[i] = { ...cf, puntaje: val };
                                      const updatedEval = { ...activeEvaluacion, compromisosFuncionales: updatedFuncs };
                                      setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                                    }}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-center font-bold focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Comportamentales */}
                    <div className="space-y-4">
                      <h5 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Competencias Comportamentales (30%)</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider">
                              <th className="p-3 font-bold border-b border-slate-200">Competencia</th>
                              <th className="p-3 font-bold border-b border-slate-200 w-32">Puntaje (1-100)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {activeEvaluacion.compromisosComportamentales.map((cc, i) => (
                              <tr key={'c_'+i} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-bold text-slate-800">{cc.competencia}</td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    min="1" max="100"
                                    disabled={activeEvaluacion.estado === 'Enviado' || activeEvaluacion.estado === 'Aprobado'}
                                    value={cc.puntaje || 0}
                                    onChange={(e) => {
                                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                      const updatedComps = [...activeEvaluacion.compromisosComportamentales];
                                      updatedComps[i] = { ...cc, puntaje: val };
                                      const updatedEval = { ...activeEvaluacion, compromisosComportamentales: updatedComps };
                                      setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                                    }}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-center font-bold focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Additional Dates & Plan */}
                    <div className="space-y-4 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                       <h5 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Datos Complementarios y Plan de Desarrollo</h5>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                             <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Fecha Inicial del Período Evaluado</label>
                             <input type="date" disabled={activeEvaluacion.estado === 'Enviado' || activeEvaluacion.estado === 'Aprobado'} value={activeEvaluacion.evalFechaInicio || ''} onChange={e => {
                                  const updatedEval = { ...activeEvaluacion, evalFechaInicio: e.target.value };
                                  setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                             }} className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500" />
                          </div>
                          <div>
                             <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Fecha Final del Período Evaluado</label>
                             <input type="date" disabled={activeEvaluacion.estado === 'Enviado' || activeEvaluacion.estado === 'Aprobado'} value={activeEvaluacion.evalFechaFinal || ''} onChange={e => {
                                  const updatedEval = { ...activeEvaluacion, evalFechaFinal: e.target.value };
                                  setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                             }} className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500" />
                          </div>
                          <div>
                             <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">N° días licencias, comisiones, incapacidades</label>
                             <input type="number" min="0" disabled={activeEvaluacion.estado === 'Enviado' || activeEvaluacion.estado === 'Aprobado'} value={activeEvaluacion.evalDiasIncapacidad || 0} onChange={e => {
                                  const updatedEval = { ...activeEvaluacion, evalDiasIncapacidad: parseInt(e.target.value)||0 };
                                  setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                             }} className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500" />
                          </div>
                          <div>
                             <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Total Días Valorados</label>
                             <input type="number" min="0" disabled={activeEvaluacion.estado === 'Enviado' || activeEvaluacion.estado === 'Aprobado'} value={activeEvaluacion.evalDiasValorados || 0} onChange={e => {
                                  const updatedEval = { ...activeEvaluacion, evalDiasValorados: parseInt(e.target.value)||0 };
                                  setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                             }} className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500" />
                          </div>
                       </div>
                       <div className="space-y-3 mt-4">
                          <div>
                             <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Competencias Objeto de Mejoramiento</label>
                             <textarea rows={2} disabled={activeEvaluacion.estado === 'Enviado' || activeEvaluacion.estado === 'Aprobado'} value={activeEvaluacion.evalCompetenciasMejorar || ''} onChange={e => {
                                  const updatedEval = { ...activeEvaluacion, evalCompetenciasMejorar: e.target.value };
                                  setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                             }} className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500" placeholder="Especifique las competencias..." />
                          </div>
                          <div>
                             <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Estrategias y acciones específicas...</label>
                             <textarea rows={2} disabled={activeEvaluacion.estado === 'Enviado' || activeEvaluacion.estado === 'Aprobado'} value={activeEvaluacion.evalEstrategiasMejorar || ''} onChange={e => {
                                  const updatedEval = { ...activeEvaluacion, evalEstrategiasMejorar: e.target.value };
                                  setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                             }} className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500" placeholder="Especifique las acciones de mejora..." />
                          </div>
                       </div>
                    </div>
                    
                    {activeEvaluacion.estado !== 'Aprobado' && activeEvaluacion.estado !== 'Enviado' && (
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => {
                                    const updatedEval = { ...activeEvaluacion, estado: 'Enviado' };
                                    setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                                    alert('Autoevaluación (Anexo 6) enviada con éxito a Rectoría.');
                                }}
                                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/10"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2z"/></svg>
                                Enviar a Revisión
                            </button>
                        </div>
                    )}
                    {(activeEvaluacion.estado === 'Aprobado' || activeEvaluacion.estado === 'Enviado') && (
                        <div className="mt-4 bg-emerald-50 text-emerald-700 text-xs font-bold p-3 rounded-xl border border-emerald-200">
                          Su autoevaluación ha sido enviada y se encuentra en estado: {activeEvaluacion.estado.toUpperCase()}. No puede ser modificada.
                        </div>
                    )}
                  </div>
                </div>
              </div>
            )}
`;

let lines = c.split('\\n'); // oops wait, c is string, I should split by newline
lines = c.split('\\n'); // no I need \n, let's just do it directly on the string
`;

let finalScript = `
const fs = require('fs');
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

c = c.replace(/useState<1 \\| 2 \\| 3>\\(1\\)/g, 'useState<1 | 2 | 3 | 4>(1)');
if (!c.includes('generarAnexo6Word')) {
  c = c.replace('import { checkIsHabilitated }', "import { generarAnexo6Word } from '../utils/exportAnexo6';\\nimport { checkIsHabilitated }");
}
const searchFunc = '  const handleExportWordAnexo5 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {';
const replaceFunc = \`  const handleExportWordAnexo6 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {
    const customLogo = localStorage.getItem('iea_custom_logo') || '';
    generarAnexo6Word(evalDoc, teacher, institutionName, customLogo);
  };
  
  const handleExportWordAnexo5 = (evalDoc: Evaluacion1278, teacher: DocenteEvaluacion) => {\`;
if (!c.includes('handleExportWordAnexo6')) {
  c = c.replace(searchFunc, replaceFunc);
}

// 4. Splice in Anexo 6 UI
const portalView3 = '{selectedPeriod >= 2 && activeEvaluacion && (';
if (!c.includes('portal-anexo6-view')) {
  c = c.replace(portalView3, \`${uiBlock}\\n\\n          {/* PORTAL VIEW 3: SEGUIMIENTO 2 & 3 (SUBIR EVIDENCIAS Y PORTAFOLIO) */}\\n          \` + portalView3);
}

// 5. Replace headers
c = c.replace(
  '<th className="px-4 py-2 w-1/12 text-center">1ra Val.</th>\\n                        <th className="px-4 py-2 w-1/12 text-center">2da Val.</th>',
  '<th className="px-4 py-2 w-2/12 text-center">PUNTAJE (1-100)</th>'
);
c = c.replace(
  '<th className="px-4 py-2 w-1/6 text-center">1ra Val.</th>\\n                        <th className="px-4 py-2 w-1/6 text-center">2da Val.</th>',
  '<th className="px-4 py-2 w-2/6 text-center">PUNTAJE (1-100)</th>'
);

// 6. Delete puntaje2 td
c = c.replace(
  /<td className="px-4 py-2">\\s*<input type="number" step="0\\.1" max="100" value={comp\\.puntaje2 \\|\\| ''} onChange={\\(e\\) => {\\s*const newArr = \\[\\.\\.\\.activeEvaluacion\\.compromisosFuncionales\\];\\s*newArr\\[idx\\] = { \\.\\.\\.newArr\\[idx\\], puntaje2: Number\\(e\\.target\\.value\\) };\\s*setActiveEvaluacion\\({ \\.\\.\\.activeEvaluacion, compromisosFuncionales: newArr }\\);\\s*}} className="w-16 mx-auto px-2 py-1 border rounded text-center text-xs" \\/>\\s*<\\/td>/g,
  ''
);
c = c.replace(
  /<td className="px-4 py-2">\\s*<input type="number" step="0\\.1" max="100" value={comp\\.puntaje2 \\|\\| ''} onChange={\\(e\\) => {\\s*const newArr = \\[\\.\\.\\.activeEvaluacion\\.compromisosComportamentales\\];\\s*newArr\\[idx\\] = { \\.\\.\\.newArr\\[idx\\], puntaje2: Number\\(e\\.target\\.value\\) };\\s*setActiveEvaluacion\\({ \\.\\.\\.activeEvaluacion, compromisosComportamentales: newArr }\\);\\s*}} className="w-16 mx-auto px-2 py-1 border rounded text-center text-xs" \\/>\\s*<\\/td>/g,
  ''
);

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c);
`;

fs.writeFileSync('run_fix_all.cjs', finalScript);
console.log("Created master fix script");
