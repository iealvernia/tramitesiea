const fs = require('fs');
let content = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

const t1 = `const teacherEvals = evaluaciones.filter(e => e.cedula === currentTeacher.cedula && e.observacionesAdmin?.trim());`;
const n1 = `const teacherEvals = evaluaciones.filter(e => e.cedula === currentTeacher.cedula && ((e.historialRetroalimentacion && e.historialRetroalimentacion.length > 0) || e.observacionesAdmin?.trim()));`;
content = content.replace(t1, n1);
content = content.replace(t1, n1); // replace both occurrences

const t2 = `const hasCorrections = evaluaciones.some(e => e.cedula === currentTeacher.cedula && e.estado === 'Corregir' && e.observacionesAdmin?.trim());`;
const n2 = `const hasCorrections = evaluaciones.some(e => e.cedula === currentTeacher.cedula && e.estado === 'Corregir' && ((e.historialRetroalimentacion && e.historialRetroalimentacion.length > 0) || e.observacionesAdmin?.trim()));`;
content = content.replace(t2, n2);

const t3 = `{ev.observacionesAdmin}
                          </p>
                        </div>
                      </div>`;
const n3 = `{ev.observacionesAdmin && (
                              <p className={\`text-sm font-semibold whitespace-pre-wrap leading-relaxed \${textClass}\`}>
                                {ev.observacionesAdmin}
                              </p>
                            )}
                            {ev.historialRetroalimentacion && ev.historialRetroalimentacion.length > 0 && (
                              <div className="space-y-3 mt-4 border-t pt-4 border-slate-200/50">
                                <h5 className="text-xs font-bold uppercase tracking-wider opacity-70">Historial de Revisiones</h5>
                                {ev.historialRetroalimentacion.map(fb => (
                                  <div key={fb.id} className="bg-white/50 p-3 rounded-lg border border-slate-200/50">
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-xs font-bold opacity-90">{fb.autor} <span className="opacity-70 font-normal">({fb.anexo})</span></span>
                                      <span className="text-[10px] opacity-60">{new Date(fb.fecha).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed opacity-90">{fb.mensaje}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>`;

content = content.replace(t3, n3);

const delT = `if (window.confirm("¿Está seguro que desea eliminar este envío? Esta acción no se puede deshacer y borrará todos los datos asociados.")) {`;
const delN = `if (window.confirm("¿Está de acuerdo en borrar? Se borrará toda la información agregada por el docente y no se podrá deshacer.")) {`;
content = content.replace(delT, delN);

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', content, 'utf8');
console.log("Done teacher modal");
