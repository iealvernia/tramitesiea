const fs = require('fs');
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

const regexToReplace = /\{\/\*\s*Feedback Inputs\s*\*\/\}[\s\S]*\{\/\*\s*Approval Actions Panel\s*\*\/\}[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/;

const newCode = `              {/* Feedback Inputs */}
              {Number(selectedEvalForInspection.periodo) === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-3">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-blue-800 text-xs uppercase tracking-wider">Retroalimentación Anexo 2</h4>
                      <p className="text-[10px] text-blue-600/70">Comentarios específicos para evidencias de Anexo 2.</p>
                    </div>
                    <textarea
                      value={adminFeedbackAnexo2}
                      onChange={(e) => setAdminFeedbackAnexo2(e.target.value)}
                      rows={2}
                      className="w-full p-2 bg-white border border-blue-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                      placeholder="Escriba sugerencias..."
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleAdminSubmitFeedback(selectedEvalForInspection.id, 'Anexo 2', adminFeedbackAnexo2)}
                        className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase transition-all"
                      >
                        Enviar Comentario
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-xl space-y-3">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-purple-800 text-xs uppercase tracking-wider">Retroalimentación Anexo 5</h4>
                      <p className="text-[10px] text-purple-600/70">Comentarios específicos para evidencias de Anexo 5.</p>
                    </div>
                    <textarea
                      value={adminFeedbackAnexo5}
                      onChange={(e) => setAdminFeedbackAnexo5(e.target.value)}
                      rows={2}
                      className="w-full p-2 bg-white border border-purple-200 rounded-lg text-xs focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                      placeholder="Escriba sugerencias..."
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleAdminSubmitFeedback(selectedEvalForInspection.id, 'Anexo 5', adminFeedbackAnexo5)}
                        className="py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold uppercase transition-all"
                      >
                        Enviar Comentario
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {(Number(selectedEvalForInspection.periodo) === 2 || Number(selectedEvalForInspection.periodo) === 3) && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl space-y-3">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-emerald-800 text-xs uppercase tracking-wider">Retroalimentación Portafolio</h4>
                      <p className="text-[10px] text-emerald-600/70">Comentarios específicos para evidencias de Portafolio.</p>
                    </div>
                    <textarea
                      value={adminFeedback}
                      onChange={(e) => setAdminFeedback(e.target.value)}
                      rows={2}
                      className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                      placeholder="Escriba sugerencias..."
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          handleAdminSubmitFeedback(selectedEvalForInspection.id, 'Portafolio', adminFeedback);
                          setAdminFeedback('');
                        }}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase transition-all"
                      >
                        Enviar Comentario
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {Number(selectedEvalForInspection.periodo) === 4 && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl space-y-3">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-indigo-800 text-xs uppercase tracking-wider">Retroalimentación Anexo 6</h4>
                      <p className="text-[10px] text-indigo-600/70">Comentarios específicos para evidencias de Anexo 6.</p>
                    </div>
                    <textarea
                      value={adminFeedback}
                      onChange={(e) => setAdminFeedback(e.target.value)}
                      rows={2}
                      className="w-full p-2 bg-white border border-indigo-200 rounded-lg text-xs focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                      placeholder="Escriba sugerencias..."
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          handleAdminSubmitFeedback(selectedEvalForInspection.id, 'Anexo 6', adminFeedback);
                          setAdminFeedback('');
                        }}
                        className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase transition-all"
                      >
                        Enviar Comentario
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Approval Actions Panel */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4 mt-4">
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      if (window.confirm("¿Está seguro que desea eliminar este envío? Esta acción no se puede deshacer y borrará todos los datos asociados.")) {
                        handleAdminDeleteEvaluation(selectedEvalForInspection.id);
                      }
                    }}
                    className="py-2 px-3 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                    title="Eliminar este envío falso/borrador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAdminChangeStatus(selectedEvalForInspection.id, 'Corregir')}
                    className="py-2 px-4 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Solicitar Correcciones
                  </button>
                  <button
                    onClick={() => handleAdminChangeStatus(selectedEvalForInspection.id, 'Aprobado')}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-emerald-500/10"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {Number(selectedEvalForInspection.periodo) === 1 ? 'Aprobar Concertación' : 
                     (Number(selectedEvalForInspection.periodo) === 2 || Number(selectedEvalForInspection.periodo) === 3) ? 'Aprobar Portafolio' : 
                     'Aprobar Anexo 6'}
                  </button>
                </div>
              </div>`;

if (!regexToReplace.test(c)) {
  console.log("Regex did not match!");
} else {
  c = c.replace(regexToReplace, newCode);
  fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c, 'utf8');
  console.log('Successfully replaced Feedback and Approval Actions Panel');
}
