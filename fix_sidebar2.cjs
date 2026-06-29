const fs = require('fs');
const restored = fs.readFileSync('e:\\gestión-tramites-alvernia\\src\\App_restored.tsx', 'utf8').split('\n');
const start = restored.findIndex(l => l.includes('/* ADMINISTRATOR SIDEBAR NAVIGATION */'));
const end = restored.findIndex(l => l.includes('Gestión del Sistema') || l.includes('Gesti\uFFFDn del Sistema'));
let sidebar = restored.slice(start, end).join('\n');
sidebar = sidebar.replace(/Cmputo/g, 'Cómputo');
sidebar = sidebar.replace(/C\uFFFDmputo/g, 'Cómputo');
sidebar = sidebar.replace(/Matr\uFFFDculas/g, 'Matrículas');
sidebar = sidebar.replace(/Matrculas/g, 'Matrículas');

const app = fs.readFileSync('e:\\gestión-tramites-alvernia\\src\\App.tsx', 'utf8').split('\n');
const appStart = app.findIndex(l => l.includes('id="tab-btn-mensajes-sidebar-teacher"'));
const appEnd = app.findIndex(l => l.includes('id="tab-btn-reportes-sidebar"'));

// Find exact end in App.tsx
const endBlock = app.findIndex(l => l.includes('Gestión del Sistema') || l.includes('Gesti'));

const before = app.slice(0, appStart + 1).join('\n');
const teacherFeedbackEnd = `              >
                <AlertCircle className={\`w-4 h-4 shrink-0 \${teacherMessagesStatus === 'red' ? 'text-rose-500 animate-pulse' : teacherMessagesStatus === 'green' ? 'text-emerald-500' : 'text-indigo-400'}\`} />
                Retroalimentación
              </button>
            </>
          ) : (
            /* ADMINISTRATOR SIDEBAR NAVIGATION */`;
            
const after = app.slice(endBlock).join('\n');

fs.writeFileSync('e:\\gestión-tramites-alvernia\\src\\App.tsx', before + '\n' + teacherFeedbackEnd + '\n' + sidebar.slice(sidebar.indexOf('<>')) + '\n' + after, 'utf8');
console.log('Restored correctly this time');
