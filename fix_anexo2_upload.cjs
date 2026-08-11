const fs = require('fs');
let content = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

const targetStr = `<div className="md:col-span-8">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nombre / Descripción de la Evidencia</label>
                            <input
                              type="text"
                              value={row.nombre || ''}
                              onChange={(e) => handleEvidenceRowChange(row.id, 'nombre', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Ej: Informe anual de rendimiento académico de grado 5°"
                            />
                          </div>

                          {/* Attachment management */}
                          <div className="md:col-span-4 flex flex-col justify-end">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Soporte Adjunto</label>
                            {row.fileName ? (
                              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between gap-2 text-xs">
                                <span className="font-semibold text-slate-700 truncate max-w-[150px]" title={row.fileName}>{row.fileName}</span>
                                <div className="flex gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleDownloadFile(row)}
                                    className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                                    title="Descargar archivo"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleEvidenceRowChange(row.id, 'fileName', undefined);
                                      handleEvidenceRowChange(row.id, 'fileSize', undefined);
                                      handleEvidenceRowChange(row.id, 'fileType', undefined);
                                      handleEvidenceRowChange(row.id, 'fileBase64', undefined);
                                    }}
                                    className="p-1 hover:bg-red-100 text-red-500 rounded"
                                    title="Quitar soporte"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className="w-full flex items-center justify-center border border-dashed border-slate-300 hover:border-blue-400 py-2 rounded-lg cursor-pointer transition-colors text-[11px] font-bold text-slate-600 gap-1.5 bg-slate-50/50 hover:bg-blue-50/20">
                                <Upload className="w-3.5 h-3.5 text-slate-500" />
                                Subir Soporte (PDF/Word)
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx"
                                  onChange={(e) => handleFileUpload(e, row.id)}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>`;

const replacement = `<div className="md:col-span-12">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nombre / Descripción de la Evidencia</label>
                            <input
                              type="text"
                              value={row.nombre || ''}
                              onChange={(e) => handleEvidenceRowChange(row.id, 'nombre', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Ej: Informe anual de rendimiento académico de grado 5°"
                            />
                          </div>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacement);
  fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', content, 'utf8');
  console.log("Successfully removed Soporte Adjunto.");
} else {
  console.log("String not found. Let's try ignoring spaces.");
  // fall back to a simpler regex that is very exact
  const simpleRegex = /<div className="md:col-span-8">[\s\S]*?{row\.fileName \? \([\s\S]*?<\/label>\s*\)\s*}\s*<\/div>/;
  content = content.replace(simpleRegex, replacement);
  fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', content, 'utf8');
  console.log("Removed with regex.");
}
