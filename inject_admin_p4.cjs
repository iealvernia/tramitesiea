const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

const searchString = `          </div>
        )}
  
      {/* CRITERIA SELECTOR MODAL */`;

const injectString = `          {selectedEvalForInspection.periodo === 4 && (
                <div className="space-y-6">
                  <div className="bg-fuchsia-50 border border-fuchsia-200 p-4 rounded-xl flex items-start gap-3">
                    <Award className="w-5 h-5 text-fuchsia-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-fuchsia-900 text-sm uppercase tracking-wide">Calificaci\u00f3n Evaluaci\u00f3n Final (Anexo 6)</h4>
                      <p className="text-xs text-fuchsia-700 mt-1">Ingrese los puntajes para cada competencia evaluada. Los promedios se calcular\u00e1n autom\u00e1ticamente.</p>
                    </div>
                  </div>
                  
                  <!-- Puntajes Funcionales -->
                  <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-4 bg-slate-100/50 border-b border-slate-200">
                      <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Competencias Funcionales</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full bg-white text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Competencia</th>
                            <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-24">1ra Val.</th>
                            <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-24">2da Val.</th>
                            <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-24">Final</th>
                          </tr>
                        </thead>
                        <dbody className="divide-y divide-slate-100">
                          {selectedEvalForInspection.compromisosFuncionales.map((cf, idx) => {
                             const puntaje1 = Number(cf.puntaje) || 0;
                             const puntaje2 = Number(cf.puntaje2) || 0;
                             const has1 = cf.puntaje !== undefined && cf.puntaje !== null;
                             const has2 = cf.puntaje2 !== undefined && cf.puntaje2 !== null;
                             let avg = 0;
                             if (has1 && has2) avg = (puntaje1 + puntaje2) / 2;
                             else if (has1) avg = puntaje1;
                             else if (has2) avg = puntaje2;
                          return (
                            <tr key={idx} className="hover:bg-slate-50 animate-fade-in" style= {{animationDelay: \`${idx * 50}ms\`}}>
                              <td className="p-3">
                                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-0.5"><span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded backdrop-blur-md">{cf.area}</span></p>
                                <p className="text-xs font-bold text-slate-800">{cf.competencia}</p>
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={cf.puntaje || ''}
                                  onChange={(e) => {
                                    const updated = { ...cf, puntaje: parseInt(e.target.value) || undefined };
                                    const newFuncs = [...selectedEvalForInspection.compromisosFuncionales];
                                    newFuncs[idx] = updated;
                                    const newEval = { ...selectedEvalForInspection, compromisosFuncionales: newFuncs };
                                    setSelectedEvalForInspection(newEval);
                                    setEvaluaciones(prev => prev.map(ev => ev.id === newEval.id ? newEval : ev));
                                  }}
                                  className="w-full p-2 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={cf.puntaje2 || ''}
                                  onChange={(e) => {
                                    const updated = { ...cf, puntaje2: parseInt(e.target.value) || undefined };
                                    const newFuncs = [...selectedEvalForInspection.compromisosFuncionales];
                                    newFuncs[idx] = updated;
                                    const newEval = { ...selectedEvalForInspection, compromisosFuncionales: newFuncs };
                                    setSelectedEvalForInspection(newEval);
                                    setEvaluaciones(prev => prev.map(ev => ev.id === newEval.id ? newEval : ev));
                                  }}
                                  className="w-full p-2 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                                />
                              </td>
                              <td className="p-3 bg-blue-50/30 font-bold text-blue-900 text-center">
                                {avg !== 0 ? avg.toFixed(1) : ''}
                              </td>
                            </tr>
                            )}})}
                        </dbody>
                      </table>
                    </div>
                  </div>
                  
                  <!-- Puntajes Comportamentales -->
                  <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-4 bg-slate-100/50 border-b border-slate-200">
                      <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Competencias Comportamentales</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full bg-white text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Competencia</th>
                            <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-24">1ra Val.</th>
                            <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-24">2da Val.</th>
                            <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-24">Final</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedEvalForInspection.compromisosComportamentales.map((cc, idx) => {
                             const puntaje1 = Number(cc.puntaje) || 0;
                             const puntaje2 = Number(cc.puntaje2) || 0;
                             const has1 = cc.puntaje !== undefined && cc.puntaje !== null;
                             const has2 = cc.puntaje2 !== undefined && cc.puntaje2 !== null;
                             let avg = 0;
                             if (has1 && has2) avg = (puntaje1 + puntaje2) / 2;
                             else if (has1) avg = puntaje1;
                             else if (has2) avg = puntaje2;
                           return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-3">
                                <p className="text-xs font-bold text-slate-800">{cc.competencia}</p>
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={cc.puntaje || ''}
                                  onChange={(e) => {
                                    const updated = { ...cc, puntaje: parseInt(e.target.value) || undefined };
                                    const newComps = [...selectedEvalForInspection.compromisosComportamentales];
                                    newComps[idx] = updated;
                                    const newEval = { ...selectedEvalForInspection, compromisosComportamentales: newComps };
                                    setSelectedEvalForInspection(newEval);
                                    setEvaluaciones(prev => prev.map(ev => ev.id === newEval.id ? newEval : ev));
                                  }}
                                  className="w-full p-2 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={cc.puntaje2 || ''}
                                  onChange={(e) => {
                                    const updated = { ...cc, puntaje2: parseInt(e.target.value) || undefined };
                                    const newComps = [...selectedEvalForInspection.compromisosComportamentales];
                                    newComps[idx] = updated;
                                    const newEval = { ...selectedEvalForInspection, compromisosComportamentales: newComps };
                                    setSelectedEvalForInspection(newEval);
                                    setEvaluaciones(prev => prev.map(ev => ev.id === newEval.id ? newEval : ev));
                                  }}
                                  className="w-full p-2 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                                />
                              </td>
                              <td className="p-3 bg-blue-50/30 font-bold text-blue-900 text-center">
                                {avg !== 0 ? avg.toFixed(1) : ''}
                              </td>
                            </tr>
                            )}})}
                        </dbody>
                      </table>
                    </div>
                  </div>
                  
                  <!-- Additional Dates & Plan -->
                  <div className="space-y-4 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                     <h5 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Datos Complementarios y Plan de Desarrollo</h5>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Fecha Inicial del Per\u00edodo Evaluado</label>
                           <input type="date" value={selectedEvalForInspection.evalFechaInicio || ''} onChange={e => {
                                const updatedEval = { ...selectedEvalForInspection, evalFechaInicio: e.target.value };
                                setSelectedEvalForInspection(updatedEval);
                                setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                           }} className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Fecha Final del Per\u00edodo Evaluado</label>
                           <input type="date" value={selectedEvalForInspection.evalFechaFinal || ''} onChange={e => {
                                const updatedEval = { ...selectedEvalForInspection, evalFechaFinal: e.target.value };
                                setSelectedEvalForInspection(updatedEval);
                                setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                           }} className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">N\u00b0 d\u00edas licencias, comisiones, incapacidades</label>
                           <input type="number" min="0" value={selectedEvalForInspection.evalDiasIncapacidad || 0} onChange={e => {
                                const updatedEval = { ...selectedEvalForInspection, evalDiasIncapacidad: parseInt(e.target.value)||0 };
                                setSelectedEvalForInspection(updatedEval);
                                setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                           }} className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Total D\u00edas Valorados</label>
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
                           <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Estrategias y acciones espec\u00edficas...</label>
                           <textarea rows={2} value={selectedEvalForInspection.evalEstrategiasMejorar || ''} onChange={e => {
                                const updatedEval = { ...selectedEvalForInspection, evalEstrategiasMejorar: e.target.value };
                                setSelectedEvalForInspection(updatedEval);
                                setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                           }} className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500" placeholder="Especifique las acciones de mejora..." />
                        </div>
                     </div>
                  </div>
                  
                  {1/* Feedback and Approval Actions Panel for S4 */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                     <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Planilla de Retroalimentaci\u00f3n y Estado (S4):</h4>
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
                           Guardar Calificaci\u00f3n
                        </button>
                     </div>
                  </div>
                </div>
              )}

          </div>
        )}
  
      {/* CRITERIA SELECTOR MODAL */`;

code = code.replace(searchString, injectString);

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', code);
console.log('Admin Period 4 UI Injected');
