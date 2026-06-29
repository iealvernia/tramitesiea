const fs = require('fs');

let app = fs.readFileSync('e:\\gestión-tramites-alvernia\\src\\App.tsx', 'utf8');

// 1. Add states
if (!app.includes('const [isTeacherLogin, setIsTeacherLogin]')) {
  app = app.replace(
    /const \[loginError, setLoginError\] = useState<string \| null>\(null\);/,
    "const [loginError, setLoginError] = useState<string | null>(null);\n  const [isTeacherLogin, setIsTeacherLogin] = useState(false);\n  const [teacherCedulaLogin, setTeacherCedulaLogin] = useState('');"
  );
}

// 2. Add handleTeacherLoginSubmit
if (!app.includes('const handleTeacherLoginSubmit = (e: React.FormEvent)')) {
  app = app.replace(
    /  const getSedeFormatted = \(s: string\) => {/,
    `  const handleTeacherLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const cedula = teacherCedulaLogin.trim();
    
    // Check the separate docentesEvaluacion list
    const teacher = docentesEvaluacion.find(d => d.cedula === cedula);
    if (!teacher) {
      setLoginError("No se encontró ningún docente activo con esta cédula en el listado de Evaluación Docente.");
      return;
    }
    setCurrentTeacher(teacher);
    setTeacherCedulaLogin('');
  };

  const getSedeFormatted = (s: string) => {`
  );
}

// 3. Update the Login UI to include the toggle and the conditional forms
const oldFormRegex = /<form onSubmit=\{handleLoginSubmit\}[\s\S]*?<\/form>/;
const newFormUI = `
          {/* Login Type Toggle */}
          <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
            <button
              onClick={() => {
                setIsTeacherLogin(false);
                setLoginError(null);
              }}
              className={\`flex-1 py-2 text-xs font-extrabold uppercase tracking-widest rounded-lg transition-all \${!isTeacherLogin ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}\`}
            >
              Administrador
            </button>
            <button
              onClick={() => {
                setIsTeacherLogin(true);
                setLoginError(null);
              }}
              className={\`flex-1 py-2 text-xs font-extrabold uppercase tracking-widest rounded-lg transition-all \${isTeacherLogin ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}\`}
            >
              Docentes
            </button>
          </div>

          {!isTeacherLogin ? (
            /* ADMIN LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-5" id="auth-form-submission-admin">
              {loginError && (
                <div className="bg-rose-950/40 border border-rose-900/50 p-4 rounded-xl text-rose-300 text-xs font-semibold flex items-start gap-2" id="auth-login-error-pill-admin">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight">{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="eg. matriculas@alvernia.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-medium text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-medium text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Ingreso Administrador</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* TEACHER LOGIN FORM */
            <form onSubmit={handleTeacherLoginSubmit} className="space-y-5" id="auth-form-submission-teacher">
              {loginError && (
                <div className="bg-rose-950/40 border border-rose-900/50 p-4 rounded-xl text-rose-300 text-xs font-semibold flex items-start gap-2" id="auth-login-error-pill-teacher">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight">{loginError}</span>
                </div>
              )}

              <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-xl mb-4">
                <p className="text-xs text-emerald-400 font-medium text-center">
                  Módulo exclusivo para acceder a tus evaluaciones de desempeño y anexos.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Número de Cédula</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1002345678"
                    value={teacherCedulaLogin}
                    onChange={(e) => setTeacherCedulaLogin(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-medium text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4 shrink-0" />
                <span>Ingreso Docentes</span>
              </button>
            </form>
          )}
`;

app = app.replace(oldFormRegex, newFormUI);

fs.writeFileSync('e:\\gestión-tramites-alvernia\\src\\App.tsx', app, 'utf8');
console.log('Successfully injected Teacher Login UI & Logic!');
