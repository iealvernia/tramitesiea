const fs = require('fs');
let c = fs.readFileSync('src/components/EvaluacionDocentePanel.tsx', 'utf8');

c = c.replace(/<AnimatePresence>([\s\S]*?)isMessagesModalOpen([\s\S]*?)<motion\.div\s*initial=\{[\s\S]*?className="bg-white rounded-3xl w-full max-w-3xl max-h-\[85vh\] shadow-2xl overflow-hidden flex flex-col"\s*>/m, 
`{isMessagesModalOpen && currentTeacher && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" id="teacher-messages-modal">
              <div
                className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col"
              >`);

c = c.replace(/<\/motion\.div>\s*<\/div>\s*\)\}\s*<\/AnimatePresence>/m, 
`</div>
            </div>
          )}`);

fs.writeFileSync('src/components/EvaluacionDocentePanel.tsx', c, 'utf8');
console.log('Successfully updated transition');
