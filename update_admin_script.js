const fs = require('fs');
let code = fs.readFileSync('insert_admin_p4.cjs', 'utf8');

code = code.replace(
                                <td className="p-3">
                                  <input
                                    type="number"
                                    min="1" max="100"
                                    disabled={activeEvaluacion.estado === 'Enviado' || activeEvaluacion.estado === 'Aprobado'}
                                    value={cf.puntaje || 0}
                                    onChange={(e) => {
                                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                      updatedFuncs[i] = { ...cf, puntaje: val };
                                      const updatedEval = { ...selectedEvalForInspection, compromisosFuncionales: updatedFuncs };
                                      setSelectedEvalForInspection(updatedEval);
                                      setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                                    }}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-center font-bold focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                  />
                                </td>,
                                <td className="p-3">
                                  <input
                                    type="number"
                                    min="1" max="100"
                                    disabled={activeEvaluacion.estado === 'Enviado' || activeEvaluacion.estado === 'Aprobado'}
                                    value={cf.puntaje || 0}
                                    onChange={(e) => {
                                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                      updatedFuncs[i] = { ...cf, puntaje: val };
                                      const updatedEval = { ...selectedEvalForInspection, compromisosFuncionales: updatedFuncs };
                                      setSelectedEvalForInspection(updatedEval);
                                      setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                                    }}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-center font-bold focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    min="1" max="100"
                                    disabled={activeEvaluacion.estado === 'Enviado' || activeEvaluacion.estado === 'Aprobado'}
                                    value={cf.puntaje2 || 0}
                                    onChange={(e) => {
                                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                      updatedFuncs[i] = { ...cf, puntaje2: val };
                                      const updatedEval = { ...selectedEvalForInspection, compromisosFuncionales: updatedFuncs };
                                      setSelectedEvalForInspection(updatedEval);
                                      setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                                    }}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-center font-bold focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                  />
                                </td>
                                <td className="p-3 bg-blue-50/30 font-bold text-blue-900 text-center">
                                  {(((Number(cf.puntaje) || 0) + (Number(cf.puntaje2) || 0)) / (cf.puntaje && cf.puntaje2 ? 2 : 1)).toFixed(1)}
                                </td>
);

code = code.replace(
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="1" max="100"
                                  disabled={activeEvaluacion.estado === 'Enviado' || activeEvaluacion.estado === 'Aprobado'}
                                  value={cc.puntaje || 0}
                                  onChange={(e) => {
                                    const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                    updatedComps[i] = { ...cc, puntaje: val };
                                    const updatedEval = { ...selectedEvalForInspection, compromisosComportamentales: updatedComps };
                                    setSelectedEvalForInspection(updatedEval);
                                    setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                                  }}
                                  className="w-full p-2 border border-slate-200 rounded-lg text-center font-bold focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                />
                              </td>,
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="1" max="100"
                                  disabled={activeEvaluacion.estado === 'Enviado' || activeEvaluacion.estado === 'Aprobado'}
                                  value={cc.puntaje || 0}
                                  onChange={(e) => {
                                    const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                    updatedComps[i] = { ...cc, puntaje: val };
                                    const updatedEval = { ...selectedEvalForInspection, compromisosComportamentales: updatedComps };
                                    setSelectedEvalForInspection(updatedEval);
                                    setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                                  }}
                                  className="w-full p-2 border border-slate-200 rounded-lg text-center font-bold focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="1" max="100"
                                  disabled={activeEvaluacion.estado === 'Enviado' || activeEvaluacion.estado === 'Aprobado'}
                                  value={cc.puntaje2 || 0}
                                  onChange={(e) => {
                                    const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                    updatedComps[i] = { ...cc, puntaje2: val };
                                    const updatedEval = { ...selectedEvalForInspection, compromisosComportamentales: updatedComps };
                                    setSelectedEvalForInspection(updatedEval);
                                    setEvaluaciones(prev => prev.map(ev => ev.id === updatedEval.id ? updatedEval : ev));
                                  }}
                                  className="w-full p-2 border border-slate-200 rounded-lg text-center font-bold focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                />
                              </td>
                              <td className="p-3 bg-blue-50/30 font-bold text-blue-900 text-center">
                                {(((Number(cc.puntaje) || 0) + (Number(cc.puntaje2) || 0)) / (cc.puntaje && cc.puntaje2 ? 2 : 1)).toFixed(1)}
                              </td>
);

fs.writeFileSync('insert_admin_p4.cjs', code);
console.log('insert_admin_p4.cjs updated');
