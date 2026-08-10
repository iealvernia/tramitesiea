const fs = require('fs');
const lines = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8').split('\n');

const replacementLines = `              </>
              )}

              {selectedEvalForInspection.periodo === 4 && (
                <div className="space-y-6">
                  <div className="bg-fuchsia-50 border border-fuchsia-200 p-4 rounded-xl flex items-start gap-3">
                    <Award className="w-5 h-5 text-fuchsia-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-fuchsia-900 text-sm uppercase tracking-wide">Calificación Evaluación Final (Anexo 6)</h4>
                      <p className="text-xs text-fuchsia-700 mt-1">Ingrese los puntajes para cada competencia evaluada. Los promedios se calcularán automáticamente.</p>
                    </div>
                  </div>

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
                          {selectedEvalForInspection.compromisosFuncionales.map((cf, i) => (
                            <tr key={'f_'+i} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3">
                                <div className="font-bold text-slate-800">{cf.competencia}</div>
                                <div className="text-[10px] text-slate-500 line-clamp-1">{cf.area}</div>
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="1" max="100"
                                  value={cf.puntaje || 0}
                                  onChange={(e) => {
                                    const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                    const updatedFuncs = [...selectedEvalForInspection.compromisosFuncionales];
                                    updatedFuncs[i] = { ...cf, puntaje: val };
                                    const updatedEval = { ...selectedEvalForInspection, compromisosFuncionales: updatedFuncs };
                                    setSelectedEvalForInspection(updatedEval);
                                    setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                                  }}
                                  className="w-full p-2 border border-slate-200 rounded-lg text-center font-bold focus:ring-1 focus:ring-fuchsia-500 outline-none"
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
                          {selectedEvalForInspection.compromisosComportamentales.map((cc, i) => (
                            <tr key={'c_'+i} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-bold text-slate-800">{cc.competencia}</td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="1" max="100"
                                  value={cc.puntaje || 0}
                                  onChange={(e) => {
                                    const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                    const updatedComps = [...selectedEvalForInspection.compromisosComportamentales];
                                    updatedComps[i] = { ...cc, puntaje: val };
                                    const updatedEval = { ...selectedEvalForInspection, compromisosComportamentales: updatedComps };
                                    setSelectedEvalForInspection(updatedEval);
                                    setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                                  }}
                                  className="w-full p-2 border border-slate-200 rounded-lg text-center font-bold focus:ring-1 focus:ring-fuchsia-500 outline-none"
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
                           <input type="date" value={selectedEvalForInspection.evalFechaInicio || ''} onChange={e => {
                                const updatedEval = { ...selectedEvalForInspection, evalFechaInicio: e.target.value };
                                setSelectedEvalForInspection(updatedEval);
                                setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                           }} className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Fecha Final del Período Evaluado</label>
                           <input type="date" value={selectedEvalForInspection.evalFechaFinal || ''} onChange={e => {
                                const updatedEval = { ...selectedEvalForInspection, evalFechaFinal: e.target.value };
                                setSelectedEvalForInspection(updatedEval);
                                setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                           }} className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">N° días licencias, comisiones, incapacidades</label>
                           <input type="number" min="0" value={selectedEvalForInspection.evalDiasIncapacidad || 0} onChange={e => {
                                const updatedEval = { ...selectedEvalForInspection, evalDiasIncapacidad: parseInt(e.target.value)||0 };
                                setSelectedEvalForInspection(updatedEval);
                                setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                           }} className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Total Días Valorados</label>
                           <input type="number" min="0" value={selectedEvalForInspection.evalDiasValorados || 0} onChange={e => {
                                const updatedEval = { ...selectedEvalForInspection, evalDiasValorados: parseInt(e.target.value)||0 };
                                setSelectedEvalForInspection(updatedEval);
                                setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                           }} className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500" />
                        </div>
                     </div>
                     <div className="space-y-3 mt-4">
                        <div>
                           <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Competencias Objeto de Mejoramiento</label>
                           <textarea rows={2} value={selectedEvalForInspection.evalCompetenciasMejorar || ''} onChange={e => {
                                const updatedEval = { ...selectedEvalForInspection, evalCompetenciasMejorar: e.target.value };
                                setSelectedEvalForInspection(updatedEval);
                                setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                           }} className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500" placeholder="Especifique las competencias..." />
                        </div>
                        <div>
                           <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Estrategias y acciones específicas...</label>
                           <textarea rows={2} value={selectedEvalForInspection.evalEstrategiasMejorar || ''} onChange={e => {
                                const updatedEval = { ...selectedEvalForInspection, evalEstrategiasMejorar: e.target.value };
                                setSelectedEvalForInspection(updatedEval);
                                setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                           }} className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500" placeholder="Especifique las acciones de mejora..." />
                        </div>
                     </div>
                  </div>
                  
                  {/* Feedback and Approval Actions Panel for S4 */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                     <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Planilla de Retroalimentación y Estado (S4):</h4>
                     </div>
                     <textarea
                        value={adminFeedback}
                        onChange={(e) => setAdminFeedback(e.target.value)}
                        rows={2}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                        placeholder="Comentarios finales..."
                     />
                     <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                           onClick={() => handleAdminChangeStatus(selectedEvalForInspection.id, 'Aprobado')}
                           className="py-2 px-4 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-fuchsia-500/10"
                        >
                           <Save className="w-3.5 h-3.5" />
                           Guardar Calificación
                        </button>
                     </div>
                  </div>
                </div>
              )}
            </div>`.split('\n');

lines.splice(6614, 1, ...replacementLines.map(l => l + '\r'));
fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', lines.join('\n'));
console.log('Fixed syntax error via direct array splice on index 6614');
