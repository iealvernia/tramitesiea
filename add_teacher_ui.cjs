const fs = require('fs'); 
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

const s1 = `{selectedPeriod >= 2 && activeEvaluacion && (`;
const insertBefore = `{selectedPeriod === 4 && activeEvaluacion && (
              <div className="space-y-6 animate-fade-in" id="portal-anexo6-view">
                <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm font-sans flex flex-col items-center justify-center text-center">
                  <h4 className="font-extrabold text-slate-800 text-lg uppercase tracking-wide mb-2">Evaluación Final (Anexo 6)</h4>
                  <p className="text-sm text-slate-500 mb-6 max-w-lg">
                    La evaluación final es calificada por el Rector. Una vez que el Rector haya registrado sus calificaciones, podrá visualizar su resumen y descargar el documento de Anexo 6.
                  </p>
                  
                  {activeEvaluacion.estado === 'Aprobado' || activeEvaluacion.estado === 'Enviado' ? (
                    <div className="bg-emerald-50 border-2 border-emerald-300 p-6 rounded-2xl w-full max-w-2xl text-left flex items-start gap-4">
                      <div className="space-y-4 w-full">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-emerald-800 uppercase text-xs tracking-wider">Resultados Registrados</h5>
                          <button
                            onClick={() => {
                              const emp = docentesEvaluacion.find(e => e.cedula === currentTeacher?.cedula);
                              if (emp) window.handleExportWordAnexo6?.(activeEvaluacion, emp);
                            }}
                            className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl uppercase tracking-widest text-[10px] shadow-md shadow-emerald-500/10 transition-colors flex items-center gap-2"
                          >
                            Descargar Anexo 6 (Word)
                          </button>
                        </div>
                        <p className="text-xs text-slate-600">Puede descargar su Anexo 6 finalizado para su archivo personal y notificación oficial.</p>
                      </div>
                    </div>
                  ) : (
                     <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs font-semibold text-amber-700 w-full max-w-md">
                        Aún no se ha registrado la evaluación final por parte de Rectoría.
                     </div>
                  )}
                </div>
              </div>
            )}
            
            `;

c = c.replace(s1, insertBefore + s1);

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c);
console.log('Teacher UI inserted');
