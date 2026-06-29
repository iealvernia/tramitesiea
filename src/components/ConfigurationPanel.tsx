import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Image as ImageIcon, 
  Award, 
  Check, 
  RotateCcw, 
  RefreshCw, 
  FileSpreadsheet, 
  Trash2, 
  User, 
  ExternalLink,
  ShieldAlert,
  Database,
  HelpCircle,
  Sparkles,
  Calendar
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface ConfigurationPanelProps {
  // Google Sync state and actions
  googleUser: FirebaseUser | null;
  googleToken: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  isSyncingGoogle: boolean;
  autoSyncGoogle: boolean;
  googleStatusMsg: string | null;
  setAutoSyncGoogle: (val: boolean) => void;
  handleConnectAndSyncGoogle: () => Promise<void>;
  handleManualSyncGoogle: () => Promise<void>;
  handleLogoutGoogle: () => void;
  showToast: (msg: string) => void;
  // App Reset handler
  onResetAllData: () => void;
  // Supabase states and actions
  supabaseSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  supabaseDbError: string;
  fetchFromSupabase: () => Promise<void>;
}

export default function ConfigurationPanel({
  googleUser,
  googleToken,
  spreadsheetId,
  spreadsheetUrl,
  isSyncingGoogle,
  autoSyncGoogle,
  googleStatusMsg,
  setAutoSyncGoogle,
  handleConnectAndSyncGoogle,
  handleManualSyncGoogle,
  handleLogoutGoogle,
  showToast,
  onResetAllData,
  supabaseSyncStatus,
  supabaseDbError,
  fetchFromSupabase
}: ConfigurationPanelProps) {
  const [rectorName, setRectorName] = useState('');
  const [rectorDoc, setRectorDoc] = useState('');
  const [rectorCargo, setRectorCargo] = useState('');
  const [logoBase64, setLogoBase64] = useState('');
  const [signatureBase64, setSignatureBase64] = useState('');
  const [instName, setInstName] = useState('');
  const [instDane, setInstDane] = useState('');
  const [instNit, setInstNit] = useState('');
  const [educationalLevel, setEducationalLevel] = useState('');
  const [calendario, setCalendario] = useState('');
  const [footerMotto, setFooterMotto] = useState('');
  const [footerAddress, setFooterAddress] = useState('');
  const [footerEmails, setFooterEmails] = useState('');
  const [footerWebsite, setFooterWebsite] = useState('');
  const [footerCity, setFooterCity] = useState('');
  const [evalFechas, setEvalFechas] = useState<{ [key: number]: string }>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSubSection, setActiveSubSection] = useState<'all' | 'institucion' | 'google' | 'sistema'>('all');

  // Load initial configurations (Rector & Logo & Params)
  useEffect(() => {
    const loadLocal = () => {
      const storedName = localStorage.getItem('iea_rector_name') || 'ESP. CARLOS ARCESIO ACOSTA CORONEL';
      const storedDoc = localStorage.getItem('iea_rector_doc') || 'C.C. No. 87.246.722 de La Cruz';
      const storedCargo = localStorage.getItem('iea_rector_cargo') || 'RECTOR';
      const storedLogo = localStorage.getItem('iea_custom_logo') || '';
      const storedSignature = localStorage.getItem('iea_custom_signature') || '';

      const storedInstName = localStorage.getItem('alvernia_institution_name') || 'INSTITUCIÓN EDUCATIVA ALVERNIA';
      const storedInstDane = localStorage.getItem('alvernia_institution_dane') || '186568000567';
      const storedInstNit = localStorage.getItem('alvernia_institution_nit') || '891201897-5';
      const storedEdLevel = localStorage.getItem('alvernia_educational_level') || 'NIVEL PREESCOLAR – BÁSICA PRIMARIA Y MEDIA ACADÉMICA';
      const storedCal = localStorage.getItem('alvernia_calendario') || 'CALENDARIO A';
      const storedMotto = localStorage.getItem('alvernia_footer_motto') || '“Brindamos una educación humanística y académica para la excelencia de un ser humano integral”';
      const storedAddr = localStorage.getItem('alvernia_footer_address') || 'Barrio San Martin Carrera 16 No. 12 – 77';
      const storedEmails = localStorage.getItem('alvernia_footer_emails') || 'alvernia@sedputumayo.gov.co – rectoralvernia@gmail.com';
      const storedWeb = localStorage.getItem('alvernia_footer_website') || 'www.ie-alvernia.edu.co';
      const storedCity = localStorage.getItem('alvernia_footer_city') || 'Puerto Asís - Putumayo';
      const storedFechas = localStorage.getItem('alvernia_habilitation_dates');

      setRectorName(storedName);
      setRectorDoc(storedDoc);
      setRectorCargo(storedCargo);
      setLogoBase64(storedLogo);
      setSignatureBase64(storedSignature);

      setInstName(storedInstName);
      setInstDane(storedInstDane);
      setInstNit(storedInstNit);
      setEducationalLevel(storedEdLevel);
      setCalendario(storedCal);
      setFooterMotto(storedMotto);
      setFooterAddress(storedAddr);
      setFooterEmails(storedEmails);
      setFooterWebsite(storedWeb);
      setFooterCity(storedCity);
      if (storedFechas) {
        try {
          setEvalFechas(JSON.parse(storedFechas));
        } catch (e) {}
      }
    };

    loadLocal();
    window.addEventListener('iea_config_updated', loadLocal);
    return () => {
      window.removeEventListener('iea_config_updated', loadLocal);
    };
  }, []);

  // Handle Logo Upload and Convert to Base64
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2000000) { 
      alert('Error: La imagen es demasiado grande. Seleccione un archivo menor a 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setLogoBase64(base64String);
      localStorage.setItem('iea_custom_logo', base64String);
      triggerGlobalRefresh();
      showSuccessIndicator();
    };
    reader.readAsDataURL(file);
  };

  // Handle Signature Upload and Convert to Base64
  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2000000) { 
      alert('Error: La imagen de la firma es demasiado grande. Seleccione un archivo menor a 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSignatureBase64(base64String);
      localStorage.setItem('iea_custom_signature', base64String);
      triggerGlobalRefresh();
      showSuccessIndicator();
    };
    reader.readAsDataURL(file);
  };

  const triggerGlobalRefresh = () => {
    window.dispatchEvent(new Event('iea_config_updated'));
  };

  const showSuccessIndicator = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSaveTextSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('iea_rector_name', rectorName.toUpperCase());
    localStorage.setItem('iea_rector_doc', rectorDoc);
    localStorage.setItem('iea_rector_cargo', rectorCargo.toUpperCase());
    localStorage.setItem('alvernia_institution_name', instName.toUpperCase());
    localStorage.setItem('alvernia_institution_dane', instDane);
    localStorage.setItem('alvernia_institution_nit', instNit);
    localStorage.setItem('alvernia_educational_level', educationalLevel.toUpperCase());
    localStorage.setItem('alvernia_calendario', calendario.toUpperCase());
    localStorage.setItem('alvernia_footer_motto', footerMotto);
    localStorage.setItem('alvernia_footer_address', footerAddress);
    localStorage.setItem('alvernia_footer_emails', footerEmails);
    localStorage.setItem('alvernia_footer_website', footerWebsite);
    localStorage.setItem('alvernia_footer_city', footerCity);
    localStorage.setItem('alvernia_habilitation_dates', JSON.stringify(evalFechas));
    localStorage.setItem('iea_config_customized', 'true');

    triggerGlobalRefresh();
    showSuccessIndicator();
    showToast('Ajustes institucionales y parámetros de documentos guardados correctamente');
  };

  const handleResetDefaults = async () => {
    if (!confirm('¿Está seguro de restaurar los nombres, logotipos, firmas y parámetros originales del colegio?')) return;
    
    localStorage.removeItem('iea_rector_name');
    localStorage.removeItem('iea_rector_doc');
    localStorage.removeItem('iea_rector_cargo');
    localStorage.removeItem('alvernia_institution_name');
    localStorage.removeItem('alvernia_institution_dane');
    localStorage.removeItem('alvernia_institution_nit');
    localStorage.removeItem('alvernia_educational_level');
    localStorage.removeItem('alvernia_calendario');
    localStorage.removeItem('alvernia_footer_motto');
    localStorage.removeItem('alvernia_footer_address');
    localStorage.removeItem('alvernia_footer_emails');
    localStorage.removeItem('alvernia_footer_website');
    localStorage.removeItem('alvernia_footer_city');
    localStorage.removeItem('alvernia_habilitation_dates');
    localStorage.removeItem('iea_config_customized');

    setRectorName('ESP. CARLOS ARCESIO ACOSTA CORONEL');
    setRectorDoc('C.C. No. 87.246.722 de La Cruz');
    setRectorCargo('RECTOR');
    setInstName('INSTITUCIÓN EDUCATIVA ALVERNIA');
    setInstDane('186568000567');
    setInstNit('891201897-5');
    setEducationalLevel('NIVEL PREESCOLAR – BÁSICA PRIMARIA Y MEDIA ACADÉMICA');
    setCalendario('CALENDARIO A');
    setFooterMotto('“Brindamos una educación humanística y académica para la excelencia de un ser humano integral”');
    setFooterAddress('Barrio San Martin Carrera 16 No. 12 – 77');
    setFooterEmails('alvernia@sedputumayo.gov.co – rectoralvernia@gmail.com');
    setFooterWebsite('www.ie-alvernia.edu.co');
    setFooterCity('Puerto Asís - Putumayo');
    setEvalFechas({});

    let logoBase64Reloaded = '';
    let sigBase64Reloaded = '';

    const getBase64FromUrl = async (url: string): Promise<string> => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        const blob = await res.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn(`[Reset Config] Fallback fetch failed for ${url}:`, e);
        return '';
      }
    };

    logoBase64Reloaded = await getBase64FromUrl('./logo.png');
    sigBase64Reloaded = await getBase64FromUrl('./firma_rector.png');

    if (logoBase64Reloaded) {
      localStorage.setItem('iea_custom_logo', logoBase64Reloaded);
      setLogoBase64(logoBase64Reloaded);
    } else {
      localStorage.removeItem('iea_custom_logo');
      setLogoBase64('');
    }

    if (sigBase64Reloaded) {
      localStorage.setItem('iea_custom_signature', sigBase64Reloaded);
      setSignatureBase64(sigBase64Reloaded);
    } else {
      localStorage.removeItem('iea_custom_signature');
      setSignatureBase64('');
    }

    triggerGlobalRefresh();
    showSuccessIndicator();
    showToast('Valores de fábrica y logotipos restaurados con éxito');
  };

  return (
    <div className="space-y-6" id="central-config-panel-container">
      {/* Sub-header navigation inside the configurations panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-200/80 gap-4 shadow-sm" id="config-sub-nav">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
            <Settings className="w-5 h-5 animate-spin-slow text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">Menú de Ajustes Avanzados</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Configura todo lo relacionado al sistema Alvernia</p>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap w-full sm:w-auto" id="config-subtabs-row">
          <button
            onClick={() => setActiveSubSection('all')}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer ${
              activeSubSection === 'all' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-250'
            }`}
          >
            Ver Todo
          </button>
          <button
            onClick={() => setActiveSubSection('institucion')}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer ${
              activeSubSection === 'institucion' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-250'
            }`}
          >
            Firma / Rector
          </button>

          <button
            onClick={() => setActiveSubSection('sistema')}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer ${
              activeSubSection === 'sistema' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sistema y Caché
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6" id="config-main-layout-grid">
        
        {/* Left Column / Main Configuration Cards container */}
        <div className="space-y-6" id="config-left-grid-col">
          
          {/* CARD A: INSTITUTIONAL FIRM / RECTOR CONFIGURATION */}
          {(activeSubSection === 'all' || activeSubSection === 'institucion') && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" id="card-institutional-rector-config">
              <div className="bg-slate-50 border-b border-slate-200 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm uppercase text-slate-900 tracking-tight">Ajustes de Representación e Identidad de la Institución</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Control de Rectoría, Escudo Digital y Firma Autografiada en PDFs</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <form onSubmit={handleSaveTextSettings} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">Nombre Completo del Firmante (Mayúsculas)</label>
                      <input
                        type="text"
                        value={rectorName}
                        onChange={e => setRectorName(e.target.value)}
                        placeholder="Ej: ESP. CARLOS ARCESIO ACOSTA CORONEL"
                        className="w-full p-3 border border-slate-200 bg-slate-50/50 rounded-2xl text-xs uppercase font-extrabold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">Documento de Identidad y Lugar de Expedición</label>
                      <input
                        type="text"
                        value={rectorDoc}
                        onChange={e => setRectorDoc(e.target.value)}
                        placeholder="Ej: C.C. No. 87.246.722 de La Cruz"
                        className="w-full p-3 border border-slate-200 bg-slate-50/50 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">Cargo / Grado Representativo</label>
                      <input
                        type="text"
                        value={rectorCargo}
                        onChange={e => setRectorCargo(e.target.value)}
                        placeholder="Ej: RECTOR"
                        className="w-full p-3 border border-slate-200 bg-slate-50/50 rounded-2xl text-xs uppercase font-extrabold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* SECCIÓN: PARÁMETROS GENERALES DEL ESTABLECIMIENTO Y FORMATOS */}
                  <div className="border-t border-slate-200 pt-5 mt-5">
                    <h5 className="text-[11px] font-black uppercase text-blue-600 tracking-wider mb-4 flex items-center gap-1.5">
                      Parámetros de Encabezados y Pies de Página de Documentos
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">Nombre Oficial de la Institución (Mayúsculas)</label>
                        <input
                          type="text"
                          value={instName}
                          onChange={e => setInstName(e.target.value)}
                          placeholder="Ej: INSTITUCIÓN EDUCATIVA ALVERNIA"
                          className="w-full p-3 border border-slate-200 bg-slate-50/50 rounded-2xl text-xs uppercase font-extrabold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">Código DANE de la Institución</label>
                        <input
                          type="text"
                          value={instDane}
                          onChange={e => setInstDane(e.target.value)}
                          placeholder="Ej: 186568000567"
                          className="w-full p-3 border border-slate-200 bg-slate-50/50 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">NIT de la Institución</label>
                        <input
                          type="text"
                          value={instNit}
                          onChange={e => setInstNit(e.target.value)}
                          placeholder="Ej: 891201897-5"
                          className="w-full p-3 border border-slate-200 bg-slate-50/50 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">Nivel Educativo (Subencabezado de Documentos)</label>
                        <input
                          type="text"
                          value={educationalLevel}
                          onChange={e => setEducationalLevel(e.target.value)}
                          placeholder="Ej: NIVEL PREESCOLAR – BÁSICA PRIMARIA Y MEDIA ACADÉMICA"
                          className="w-full p-3 border border-slate-200 bg-slate-50/50 rounded-2xl text-xs uppercase font-extrabold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">Calendario Escolar</label>
                        <input
                          type="text"
                          value={calendario}
                          onChange={e => setCalendario(e.target.value)}
                          placeholder="Ej: CALENDARIO A"
                          className="w-full p-3 border border-slate-200 bg-slate-50/50 rounded-2xl text-xs uppercase font-extrabold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">Municipio y Departamento</label>
                        <input
                          type="text"
                          value={footerCity}
                          onChange={e => setFooterCity(e.target.value)}
                          placeholder="Ej: Puerto Asís - Putumayo"
                          className="w-full p-3 border border-slate-200 bg-slate-50/50 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">Lema / Eslogan del Pie de Página</label>
                        <input
                          type="text"
                          value={footerMotto}
                          onChange={e => setFooterMotto(e.target.value)}
                          placeholder="Ej: “Brindamos una educación humanística...”"
                          className="w-full p-3 border border-slate-200 bg-slate-50/50 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">Dirección Física</label>
                          <input
                            type="text"
                            value={footerAddress}
                            onChange={e => setFooterAddress(e.target.value)}
                            placeholder="Ej: Barrio San Martin Carrera 16 No. 12 – 77"
                            className="w-full p-3 border border-slate-200 bg-slate-50/50 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                            required
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">Correos Electrónicos</label>
                          <input
                            type="text"
                            value={footerEmails}
                            onChange={e => setFooterEmails(e.target.value)}
                            placeholder="Ej: alvernia@sedputumayo.gov.co"
                            className="w-full p-3 border border-slate-200 bg-slate-50/50 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                            required
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">Página Web</label>
                          <input
                            type="text"
                            value={footerWebsite}
                            onChange={e => setFooterWebsite(e.target.value)}
                            placeholder="Ej: www.ie-alvernia.edu.co"
                            className="w-full p-3 border border-slate-200 bg-slate-50/50 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Visual Asset 1: Escudo / Logo */}
                    <div className="border border-slate-200/80 p-4 rounded-2xl bg-slate-50/50 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                          <ImageIcon className="w-4 h-4 text-emerald-500" />
                          Escudo / Logotipo Escolar
                        </span>
                        
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            {logoBase64 ? (
                              <img src={logoBase64} alt="Custom institutional Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="text-center font-black text-slate-300 text-[9px] leading-tight flex flex-col items-center">
                                <span>SIN</span>
                                <span>ESCUDO</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-slate-700">Escudo Institución Educativa Alvernia</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">Se utiliza en el encabezado izquierdo de las constancias institucionales.</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label 
                          htmlFor="config-page-logo-input"
                          className="w-full bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-3 border border-slate-200 rounded-xl text-[10px] uppercase block text-center transition-colors cursor-pointer shadow-sm"
                        >
                          Elegir Nueva Imagen de Escudo
                        </label>
                        <input 
                          id="config-page-logo-input" 
                          type="file" 
                          accept="image/*" 
                          onChange={handleLogoChange} 
                          className="hidden" 
                        />
                      </div>
                    </div>

                    {/* Visual Asset 2: Firma Autógrafa */}
                    <div className="border border-slate-200/80 p-4 rounded-2xl bg-slate-50/50 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                          <ImageIcon className="w-4 h-4 text-emerald-500" />
                          Firma Digitalizada del Rector
                        </span>
                        
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            {signatureBase64 ? (
                              <img src={signatureBase64} alt="Custom Rector signature" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="text-center font-black text-slate-300 text-[9px] leading-tight flex flex-col items-center">
                                <span>SIN</span>
                                <span>FIRMA</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-slate-700">Firma del Firmante</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">Se sobrepone sobre la firma del rector al descargar certificados oficiales.</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label 
                          htmlFor="config-page-signature-input"
                          className="w-full bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-3 border border-slate-200 rounded-xl text-[10px] uppercase block text-center transition-colors cursor-pointer shadow-sm"
                        >
                          Elegir Nueva Imagen de Firma
                        </label>
                        <input 
                          id="config-page-signature-input" 
                          type="file" 
                          accept="image/*" 
                          onChange={handleSignatureChange} 
                          className="hidden" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase">Fechas Límite de Seguimientos (Evaluación Docente)</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-4 leading-relaxed max-w-2xl">
                      Configura la fecha oficial a partir de la cual se habilitará el botón de "Enviar para Revisión" en el aplicativo de los docentes para cada uno de los periodos.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Seguimiento 1 (Concertación)</label>
                        <input type="date" value={evalFechas[1] || ''} onChange={(e) => setEvalFechas({...evalFechas, 1: e.target.value})} className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 font-medium" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Seguimiento 2</label>
                        <input type="date" value={evalFechas[2] || ''} onChange={(e) => setEvalFechas({...evalFechas, 2: e.target.value})} className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 font-medium" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Seguimiento 3</label>
                        <input type="date" value={evalFechas[3] || ''} onChange={(e) => setEvalFechas({...evalFechas, 3: e.target.value})} className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 font-medium" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restaurar Parámetros de Fábrica
                    </button>

                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black py-2.5 px-5 rounded-xl text-[10.5px] uppercase tracking-wider transition-all shadow-md shadow-blue-600/10 cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Actualizar Identidad Rector
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}


          {/* CARD C: SYSTEM UTILITIES & LOCALSTORAGE MAINTENANCE */}
          {(activeSubSection === 'all' || activeSubSection === 'sistema') && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" id="card-system-maintenance-config">
              <div className="bg-slate-50 border-b border-slate-200 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm uppercase text-slate-900 tracking-tight">Mantenimiento del Sistema y Almacenamiento Local</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Control de registros persistentes en caché de navegador y restablecimiento general de base de datos</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="border border-rose-100 rounded-2xl bg-rose-50/20 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5" id="safe-purge-content-box">
                  <div className="space-y-1.5 max-w-xl">
                    <span className="p-1 px-2.5 bg-rose-100 text-rose-800 font-extrabold text-[9px] uppercase tracking-wider rounded-xl border border-rose-200 inline-block">
                      Zona de cuidado
                    </span>
                    <h5 className="font-extrabold text-xs text-slate-900 uppercase">Limpieza Selectiva de Datos por Módulo</h5>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Esta operación abre un panel donde podrá seleccionar de forma individual qué módulos desea limpiar (Personal y Permisos, Matrículas, Certificados, Constancias, Evaluación Docente, Docentes de Evaluación y/o Configuración). Solo se eliminarán los módulos que seleccione, tanto del almacenamiento local como de la base de datos. Utilice esta función cuando necesite reingresar información real de cero en un módulo específico.
                    </p>
                  </div>

                  <div className="shrink-0 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={onResetAllData}
                      className="w-full bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-950/20 cursor-pointer transition-all border border-rose-700/30 uppercase"
                    >
                      <Trash2 className="w-4 h-4" />
                      Limpiar Datos por Módulo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>


      </div>

      {saveSuccess && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-5 py-3 rounded-2xl border border-emerald-500 shadow-xl text-xs font-bold tracking-normal uppercase z-50 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 shrink-0" />
          Ajustes Actualizados Exitosamente
        </div>
      )}
    </div>
  );
}
