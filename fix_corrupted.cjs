const fs = require('fs');
let app = fs.readFileSync('e:\\gestión-tramites-alvernia\\src\\App.tsx', 'utf8');

const brokenBlock = `                <AlertCircle className={\`w-4 h-4 shrink-0 \${teacherMessagesStatus === 'red' ? 'text-rose-500 animate-pulse' : teacherMessagesStatus === 'green' ? 'text-emerald-500' : 'text-indigo-400'}\`} />
                  activeTab === 'reportes'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
       



                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }\`}
                id="tab-btn-reportes-sidebar"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                Reportes Generales
              </button>`;
              
const fixedBlock = `                <AlertCircle className={\`w-4 h-4 shrink-0 \${teacherMessagesStatus === 'red' ? 'text-rose-500 animate-pulse' : teacherMessagesStatus === 'green' ? 'text-emerald-500' : 'text-indigo-400'}\`} />
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
              </button>`;

if (app.includes(brokenBlock)) {
  app = app.replace(brokenBlock, fixedBlock);
  fs.writeFileSync('e:\\gestión-tramites-alvernia\\src\\App.tsx', app, 'utf8');
  console.log('Fixed the corrupted sidebar chunk!!');
} else {
  console.log('Could not find the exact broken block string.');
}
