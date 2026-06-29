const fs = require('fs');
let app = fs.readFileSync('e:\\gestión-tramites-alvernia\\src\\App.tsx', 'utf8');

const restored = fs.readFileSync('e:\\gestión-tramites-alvernia\\src\\App_restored.tsx', 'utf8');
const linesRestored = restored.split('\n');

const startIndex = linesRestored.findIndex(l => l.includes('/* ADMINISTRATOR SIDEBAR NAVIGATION */'));
const endIndex = linesRestored.findIndex(l => l.includes('Gestión del Sistema') || l.includes('Gesti\uFFFDn del Sistema') || l.includes('Gestin del Sistema'));

if (startIndex !== -1 && endIndex !== -1) {
  let sidebarCode = linesRestored.slice(startIndex, endIndex).join('\n');
  
  sidebarCode = sidebarCode.replace(/Cmputo/g, 'Cómputo');
  sidebarCode = sidebarCode.replace(/C\uFFFDmputo/g, 'Cómputo');
  sidebarCode = sidebarCode.replace(/Matr\uFFFDculas/g, 'Matrículas');
  sidebarCode = sidebarCode.replace(/Matrculas/g, 'Matrículas');
  
  const insertAdminHeader = `
            <>
              <div className="pt-2 pb-2">
                <p className="px-4 text-[9px] font-extrabold text-blue-400 uppercase tracking-widest leading-none">
                  Gestión Administrativa
                </p>
              </div>`;
  sidebarCode = sidebarCode.replace('<>', insertAdminHeader);

  const insertAcademicHeader = `
              <div className="pt-4 pb-2 border-t border-slate-700/50 mt-4">
                <p className="px-4 text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest leading-none">
                  Gestión Académica
                </p>
              </div>
              <button
                onClick={() => setActiveTab("matriculas")}`;
  sidebarCode = sidebarCode.replace(/<button\s+onClick=\{\(\) => setActiveTab\("matriculas"\)\}/g, insertAcademicHeader);
  
  const evalButton = `
              <div className="pt-4 pb-2 border-t border-slate-700/50 mt-4">
                <p className="px-4 text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest leading-none">
                  Evaluación Docente
                </p>
              </div>
              <button
                onClick={() => setActiveTab("evaluacionDocente")}
                className={\`w-full px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-xs text-left uppercase tracking-wider \${
                  activeTab === "evaluacionDocente"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }\`}
                id="tab-btn-evaluacion-sidebar"
              >
                <Award className="w-4 h-4 shrink-0" />
                Evaluación Docente 1278
              </button>
`;
  sidebarCode = sidebarCode + '\n' + evalButton + '\n';
  
  // Replace in App.tsx
  const appLines = app.split('\n');
  const appStart = appLines.findIndex(l => l.includes('id="tab-btn-mensajes-sidebar-teacher"'));
  const appEnd = appLines.findIndex(l => l.includes('id="tab-btn-reportes-sidebar"'));
  
  if (appStart !== -1 && appEnd !== -1) {
    const before = appLines.slice(0, appStart + 1).join('\n');
    const teacherFeedbackEnd = `
              >
                <AlertCircle className={\`w-4 h-4 shrink-0 \${teacherMessagesStatus === 'red' ? 'text-rose-500 animate-pulse' : teacherMessagesStatus === 'green' ? 'text-emerald-500' : 'text-indigo-400'}\`} />
                Retroalimentación
              </button>
            </>
          ) : (
            /* ADMINISTRATOR SIDEBAR NAVIGATION */`;
            
    // we need to slice AFTER the reportes button
    const endBlock = appLines.findIndex(l => l.includes('Gestión del Sistema') || l.includes('Gesti'));
    const after = appLines.slice(endBlock).join('\n');
    
    fs.writeFileSync('e:\\gestión-tramites-alvernia\\src\\App.tsx', before + '\n' + teacherFeedbackEnd + '\n' + sidebarCode + '\n' + after, 'utf8');
    console.log('Sidebar perfectly restored with sections!');
  } else {
    console.log('Could not find bounds in App.tsx', appStart, appEnd);
  }
} else {
  console.log('Could not find bounds in App_restored.tsx');
}
