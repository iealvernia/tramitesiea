const fs = require('fs');

let app = fs.readFileSync('e:\\gestión-tramites-alvernia\\src\\App_RecycleBin.tsx', 'utf8');

// 1. Fix missing states
if (!app.includes('const [teacherMessagesStatus')) {
  app = app.replace(
    /const \[currentTeacher, setCurrentTeacher\] = useState<DocenteEvaluacion \| null>\(null\);/,
    "const [currentTeacher, setCurrentTeacher] = useState<DocenteEvaluacion | null>(null);\n  const [teacherMessagesStatus, setTeacherMessagesStatus] = useState<'red' | 'green' | 'none'>('none');\n  const [triggerOpenMessages, setTriggerOpenMessages] = useState(0);"
  );
}

// 2. Fix the EvaluacionDocentePanel props injection (removing missing props)
app = app.replace(/<EvaluacionDocentePanel[\s\S]*?currentTeacher=\{currentTeacher\}[\s\S]*?\/>/, 
  `<EvaluacionDocentePanel 
              docentesEvaluacion={docentesEvaluacion}
              setDocentesEvaluacion={setDocentesEvaluacion}
              showToast={showToast}
              currentTeacher={currentTeacher}
              teacherMessagesStatus={teacherMessagesStatus}
              triggerOpenMessages={triggerOpenMessages}
            />`
);

// 3. Fix the EvaluacionDocente active tab header text
app = app.replace(
  /\{activeTab === "constancias" && "Constancias de Estudio"\}/,
  `{activeTab === "constancias" && "Constancias de Estudio"}
              {activeTab === "evaluacionDocente" && "Evaluación Docente"}`
);

// 4. Fix sidebar structure with SECTIONS and all buttons!
const sidebarBlock = `
        {/* Sidebar Nav */}
        <nav className="flex-1 p-4 space-y-1" id="sidebar-tab-navigation">
          {currentTeacher ? (
            /* TEACHER PORTAL SIDEBAR NAVIGATION */
            <>
              <div className="pt-2 pb-2">
                <p className="px-4 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest leading-none">
                  Mi Evaluación
                </p>
              </div>

              <button
                onClick={() => setActiveTab('evaluacionDocente')}
                className={\`w-full px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-xs text-left uppercase tracking-wider \${
                  activeTab === 'evaluacionDocente'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }\`}
                id="tab-btn-evaluacion-sidebar-teacher"
              >
                <Award className="w-4 h-4 shrink-0 text-blue-400" />
                Mis Anexos 2 y 5
              </button>

              <button
                onClick={() => {
                  setActiveTab('evaluacionDocente');
                  setTriggerOpenMessages(prev => prev + 1);
                }}
                className={\`w-full px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-xs text-left uppercase tracking-wider \${
                  teacherMessagesStatus === 'red'
                    ? 'bg-rose-50 border border-rose-200 text-rose-600 shadow-md shadow-rose-600/10'
                    : teacherMessagesStatus === 'green'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-md shadow-emerald-600/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }\`}
                id="tab-btn-mensajes-sidebar-teacher"
              >
                <AlertCircle className={\`w-4 h-4 shrink-0 \${teacherMessagesStatus === 'red' ? 'text-rose-500 animate-pulse' : teacherMessagesStatus === 'green' ? 'text-emerald-500' : 'text-indigo-400'}\`} />
                Retroalimentación
              </button>
            </>
          ) : (
            /* ADMINISTRATOR SIDEBAR NAVIGATION */
            <>
              <div className="pt-2 pb-2">
                <p className="px-4 text-[9px] font-extrabold text-blue-400 uppercase tracking-widest leading-none">
                  Gestión Administrativa
                </p>
              </div>

              <button
                onClick={() => setActiveTab('novedades')}
                className={\`w-full px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-xs text-left uppercase tracking-wider \${
                  activeTab === 'novedades'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }\`}
                id="tab-btn-novedades-sidebar"
              >
                <Calendar className="w-4 h-4 shrink-0" />
                Agenda de Permisos
              </button>

              <button
                onClick={() => setActiveTab('empleados')}
                className={\`w-full px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-xs text-left uppercase tracking-wider \${
                  activeTab === 'empleados'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }\`}
                id="tab-btn-empleados-sidebar"
              >
                <Users className="w-4 h-4 shrink-0" />
                Personal y Carga (Excel)
              </button>

              <button
                onClick={() => setActiveTab('computo')}
                className={\`w-full px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-xs text-left uppercase tracking-wider \${
                  activeTab === 'computo'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }\`}
                id="tab-btn-computo-sidebar"
              >
                <Clock className="w-4 h-4 shrink-0" />
                Cómputo Absoluto
              </button>

              <button
                onClick={() => setActiveTab('reportes')}
                className={\`w-full px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-xs text-left uppercase tracking-wider \${
                  activeTab === 'reportes'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }\`}
                id="tab-btn-reportes-sidebar"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                Reportes Generales
              </button>

              <div className="pt-4 pb-2 border-t border-slate-700/50 mt-4">
                <p className="px-4 text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest leading-none">
                  Gestión Académica
                </p>
              </div>
              
              <button
                onClick={() => setActiveTab("matriculas")}
                className={\`w-full px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-xs text-left uppercase tracking-wider \${
                  activeTab === "matriculas"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }\`}
                id="tab-btn-matriculas-sidebar"
              >
                <School className="w-4 h-4 shrink-0" />
                Control de Matrículas
              </button>
              
              <button
                onClick={() => setActiveTab("certificados")}
                className={\`w-full px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-xs text-left uppercase tracking-wider \${
                  activeTab === "certificados"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }\`}
                id="tab-btn-certificados-sidebar"
              >
                <FileCheck className="w-4 h-4 shrink-0" />
                Certificados Generales
              </button>

              <button
                onClick={() => setActiveTab("certificadosPama")}
                className={\`w-full px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-xs text-left uppercase tracking-wider \${
                  activeTab === "certificadosPama"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }\`}
                id="tab-btn-certificadospama-sidebar"
              >
                <Award className="w-4 h-4 shrink-0" />
                Certificados PAMA
              </button>

              <button
                onClick={() => setActiveTab("constancias")}
                className={\`w-full px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-xs text-left uppercase tracking-wider \${
                  activeTab === "constancias"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }\`}
                id="tab-btn-constancias-sidebar"
              >
                <FilePlus className="w-4 h-4 shrink-0" />
                Constancias de Estudio
              </button>

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

              <div className="pt-4 pb-2 border-t border-slate-700/50 mt-4">
                <p className="px-4 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest leading-none">
                  Gestión del Sistema
                </p>
              </div>
              
              <button
                onClick={() => setActiveTab("configuracion")}
                className={\`w-full px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 font-semibold text-xs text-left uppercase tracking-wider \${
                  activeTab === "configuracion"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }\`}
                id="tab-btn-configuracion-sidebar"
              >
                <Settings className="w-4 h-4 shrink-0" />
                Configuración General
              </button>
            </>
          )}
        </nav>
`;

const sidebarRegex = /\{\/\* Sidebar Nav \*\/\}\s*<nav className="flex-1 p-4 space-y-1" id="sidebar-tab-navigation">[\s\S]*?<\/nav>/;
app = app.replace(sidebarRegex, sidebarBlock);

// 5. Remove any `"@` strings injected previously
app = app.replace(/"@/g, '');

// 6. Fix ANY potential encoding characters globally
app = app.replace(/ning\uFFFDn/g, 'ningún');
app = app.replace(/c\uFFFDdula/g, 'cédula');
app = app.replace(/Evaluaci\uFFFDn/g, 'Evaluación');
app = app.replace(/Configuraci\uFFFDn/g, 'Configuración');
app = app.replace(/Sesi\uFFFDn/g, 'Sesión');
app = app.replace(/\uFFFDxito/g, 'éxito');
app = app.replace(/inv\uFFFDlidas/g, 'inválidas');
app = app.replace(/conexi\uFFFDn/g, 'conexión');
app = app.replace(/C\uFFFDmputo/g, 'Cómputo');
app = app.replace(/Matr\uFFFDculas/g, 'Matrículas');
app = app.replace(/Gesti\uFFFDn/g, 'Gestión');

fs.writeFileSync('e:\\gestión-tramites-alvernia\\src\\App.tsx', app, 'utf8');
console.log('App.tsx perfectly rebuilt from App_RecycleBin.tsx!');
