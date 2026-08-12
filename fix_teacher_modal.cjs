const fs = require('fs');
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');
const target = `<div className="p-5">
                            <p className={\`text-sm font-semibold whitespace-pre-wrap leading-relaxed \${textClass}\`}>
                              {ev.observacionesAdmin}
                            </p>
                          </div>`;
const replacement = `<div className="p-5 space-y-4">
                            {ev.observacionesAdmin && ev.observacionesAdmin.trim() !== '' && (
                              <div className="bg-white/50 p-3 rounded-lg border border-slate-100">
                                <p className={\`text-sm font-semibold whitespace-pre-wrap leading-relaxed \${textClass}\`}>
                                  {ev.observacionesAdmin}
                                </p>
                              </div>
                            )}
                            {ev.historialRetroalimentacion && ev.historialRetroalimentacion.length > 0 && (
                              <div className="space-y-3">
                                {ev.historialRetroalimentacion.map((entry, idx) => (
                                  <div key={entry.id || idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                        Evaluador ({entry.anexo})
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {new Date(entry.fecha).toLocaleString()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                      {entry.mensaje}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>`;
c = c.replace(target, replacement);
fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c, 'utf8');
console.log('Successfully updated teacher modal');
