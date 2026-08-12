const fs = require('fs');
let content = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

// 1. Add state for new feedback
const stateTarget = `  const [adminFeedback, setAdminFeedback] = useState('');`;
const stateNew = `  const [adminFeedback, setAdminFeedback] = useState('');
  const [adminFeedbackAnexo2, setAdminFeedbackAnexo2] = useState('');
  const [adminFeedbackAnexo5, setAdminFeedbackAnexo5] = useState('');`;
content = content.replace(stateTarget, stateNew);

// 2. Add handleAdminSubmitFeedback
const submitTarget = `  const handleAdminChangeStatus = (evalId: string, newStatus: 'Aprobado' | 'Corregir') => {`;
const submitNew = `  const handleAdminSubmitFeedback = (evalId: string, anexo: 'Anexo 2' | 'Anexo 5' | 'General', message: string) => {
    if (!message.trim()) return;
    const itemToUpdate = evaluaciones.find(item => item.id === evalId);
    if (!itemToUpdate) return;

    const newFeedback: FeedbackEntry = {
      id: crypto.randomUUID(),
      fecha: new Date().toISOString(),
      anexo,
      mensaje: message,
      autor: currentTeacher?.nombre || 'Evaluador'
    };

    const historial = itemToUpdate.historialRetroalimentacion || [];
    const updatedEval = {
      ...itemToUpdate,
      historialRetroalimentacion: [...historial, newFeedback],
      updatedAt: new Date().toISOString()
    };

    setEvaluaciones(prev => prev.map(item => item.id === evalId ? updatedEval : item));
    if (selectedEvalForInspection && selectedEvalForInspection.id === evalId) {
      setSelectedEvalForInspection(updatedEval);
    }
    syncEvaluacionesToPostgres(updatedEval);

    // clear the respective input
    if (anexo === 'Anexo 2') setAdminFeedbackAnexo2('');
    else if (anexo === 'Anexo 5') setAdminFeedbackAnexo5('');
    else setAdminFeedback('');
    
    showToast('Retroalimentación guardada y enviada.');
  };

  const handleAdminToggleAnexo = (evalId: string, anexo: 'anexo2' | 'anexo5') => {
    const itemToUpdate = evaluaciones.find(item => item.id === evalId);
    if (!itemToUpdate) return;
    
    const updatedEval = {
      ...itemToUpdate,
      [anexo === 'anexo2' ? 'anexo2Aprobado' : 'anexo5Aprobado']: !(anexo === 'anexo2' ? itemToUpdate.anexo2Aprobado : itemToUpdate.anexo5Aprobado),
      updatedAt: new Date().toISOString()
    };
    
    setEvaluaciones(prev => prev.map(item => item.id === evalId ? updatedEval : item));
    if (selectedEvalForInspection && selectedEvalForInspection.id === evalId) {
      setSelectedEvalForInspection(updatedEval);
    }
    syncEvaluacionesToPostgres(updatedEval);
  };

  const handleAdminChangeStatus = (evalId: string, newStatus: 'Aprobado' | 'Corregir') => {`;
content = content.replace(submitTarget, submitNew);

// 3. Replace Feedback UI in Admin Panel
const feedbackUiTarget = `              {/* Feedback and Approval Actions Panel */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Planilla de Retroalimentación del Evaluador:</h4>
                  <p className="text-[11px] text-slate-500">Deje una nota si el docente debe realizar correcciones o para felicitar el envío.</p>
                </div>

                <textarea
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Escriba aquí los comentarios, ajustes o correcciones necesarias..."
                />

                <div className="flex items-center justify-end gap-3 pt-2">`;

const feedbackUiNew = `              {/* Feedback History View */}
              {(selectedEvalForInspection.historialRetroalimentacion && selectedEvalForInspection.historialRetroalimentacion.length > 0) && (
                <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Historial de Retroalimentaciones</h4>
                  <div className="space-y-3">
                    {selectedEvalForInspection.historialRetroalimentacion.map((fb) => (
                      <div key={fb.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-slate-700">{fb.autor} <span className="text-slate-400 font-normal">({fb.anexo})</span></span>
                          <span className="text-[10px] text-slate-500">{new Date(fb.fecha).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-600 whitespace-pre-wrap">{fb.mensaje}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Inputs */}
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

              {/* Approval Actions Panel */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-end gap-3 pt-2">`;
// We must use regex to replace this carefully because of accents like Retroalimentación
// I will just use string replacement on a very small unique chunk
let splitArr = content.split('Planilla de Retroalimentaci');
if (splitArr.length > 1) {
    let before = splitArr[0];
    let after = 'Planilla de Retroalimentaci' + splitArr.slice(1).join('Planilla de Retroalimentaci');
    // the target ends with `<div className="flex items-center justify-end gap-3 pt-2">`
    let splitArr2 = after.split('<div className="flex items-center justify-end gap-3 pt-2">');
    let chunkToRemove = splitArr2[0];
    let afterChunk = '<div className="flex items-center justify-end gap-3 pt-2">' + splitArr2.slice(1).join('<div className="flex items-center justify-end gap-3 pt-2">');
    
    // So the target is between before and afterChunk
    // We replace the target section that contained the old textarea
    
    // We need to also replace the wrapper:
    // {/* Feedback and Approval Actions Panel */}
    // <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
    // This is right before `before` ends.
    let wrapSplit = before.split('{/* Feedback and Approval Actions Panel */}');
    let veryBefore = wrapSplit[0];
    content = veryBefore + feedbackUiNew + afterChunk;
} else {
    console.log("Could not find Planilla de Retroalimentacion string");
}

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', content, 'utf8');
console.log("Patched EvaluacionDocentePanel.tsx Feedback UI successfully");
