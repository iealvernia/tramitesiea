import React, { useState, useEffect } from 'react';
import { Settings, Image, Award, Check, RotateCcw, AlertTriangle, Database, Cloud, Copy } from 'lucide-react';

export default function GlobalConfigPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [appName, setAppName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionDane, setInstitutionDane] = useState('');
  const [institutionNit, setInstitutionNit] = useState('');
  const [educationalLevel, setEducationalLevel] = useState('');
  const [calendario, setCalendario] = useState('');
  const [footerMotto, setFooterMotto] = useState('');
  const [footerAddress, setFooterAddress] = useState('');
  const [footerEmails, setFooterEmails] = useState('');
  const [footerWebsite, setFooterWebsite] = useState('');
  const [footerCity, setFooterCity] = useState('');
  const [rectorName, setRectorName] = useState('');
  const [rectorDoc, setRectorDoc] = useState('');
  const [rectorCargo, setRectorCargo] = useState('');
  const [logoBase64, setLogoBase64] = useState('');
  const [signatureBase64, setSignatureBase64] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [dbError, setDbError] = useState<string>('');
  
  // IHS Mapping State
  const [ihsConfig, setIhsConfig] = useState<{ [subject: string]: string }>({});
  const [newSubject, setNewSubject] = useState('');
  const [newIhs, setNewIhs] = useState('');

  // Synchronize configuration from CockroachDB 'alvernia_config' table via our API
  const fetchFromCockroach = async () => {
    setSyncing(true);
    setSyncStatus('syncing');
    try {
      const response = await fetch('/api/alvernia/config');
      const data = await response.json();

      if (!data.success) {
        if (data.fallback) {
          console.warn('CockroachDB error, using fallback:', data.error);
        } else {
          console.error('Error fetching config:', data.message);
        }
        setSyncStatus('error');
        setDbError(data.error || data.message || 'Error de conexión');
        return;
      }

      setSyncStatus('synced');
      setDbError('');

        if (data.config) {
        const remoteApp = data.config.appName || 'App Gestión';
        const remoteInst = data.config.institutionName || 'INSTITUCIÓN EDUCATIVA ALVERNIA';
        const remoteDane = data.config.institutionDane || '186568000567';
        const remoteNit = data.config.institutionNit || '891201897-5';
        const remoteLevel = data.config.educationalLevel || 'NIVEL PREESCOLAR – BÁSICA PRIMARIA Y MEDIA ACADÉMICA';
        const remoteCal = data.config.calendario || 'CALENDARIO A';
        const remoteMotto = data.config.footerMotto || '“Brindamos una educación humanística y académica para la excelencia de un ser humano integral”';
        const remoteAddress = data.config.footerAddress || 'Barrio San Martin Carrera 16 No. 12 – 77';
        const remoteEmails = data.config.footerEmails || 'alvernia@sedputumayo.gov.co – rectoralvernia@gmail.com';
        const remoteWebsite = data.config.footerWebsite || 'www.ie-alvernia.edu.co';
        const remoteCity = data.config.footerCity || 'Puerto Asís - Putumayo';
        
        const remoteName = data.config.rectorName || 'ESP. CARLOS ARCESIO ACOSTA CORONEL';
        const remoteDoc = data.config.rectorDocument || 'C.C. No. 87.246.722 de La Cruz';
        const remoteCargo = data.config.rectorCargo || 'RECTOR';
        const remoteLogo = data.config.logoBase64 || '';
        const remoteSignature = data.config.rectorSignature || '';
        const remoteIhs = data.config.ihsConfig || {};

        setAppName(remoteApp);
        setInstitutionName(remoteInst);
        setInstitutionDane(remoteDane);
        setInstitutionNit(remoteNit);
        setEducationalLevel(remoteLevel);
        setCalendario(remoteCal);
        setFooterMotto(remoteMotto);
        setFooterAddress(remoteAddress);
        setFooterEmails(remoteEmails);
        setFooterWebsite(remoteWebsite);
        setFooterCity(remoteCity);
        setRectorName(remoteName);
        setRectorDoc(remoteDoc);
        setRectorCargo(remoteCargo);
        setIhsConfig(remoteIhs);

        localStorage.setItem('iea_app_name', remoteApp);
        localStorage.setItem('alvernia_institution_name', remoteInst);
        localStorage.setItem('alvernia_institution_dane', remoteDane);
        localStorage.setItem('alvernia_institution_nit', remoteNit);
        localStorage.setItem('alvernia_educational_level', remoteLevel);
        localStorage.setItem('alvernia_calendario', remoteCal);
        localStorage.setItem('alvernia_footer_motto', remoteMotto);
        localStorage.setItem('alvernia_footer_address', remoteAddress);
        localStorage.setItem('alvernia_footer_emails', remoteEmails);
        localStorage.setItem('alvernia_footer_website', remoteWebsite);
        localStorage.setItem('alvernia_footer_city', remoteCity);
        
        localStorage.setItem('iea_rector_name', remoteName);
        localStorage.setItem('iea_rector_doc', remoteDoc);
        localStorage.setItem('iea_rector_cargo', remoteCargo);
        localStorage.setItem('iea_ihs_config', JSON.stringify(remoteIhs));
        
        // Handle logo sync
        if (remoteLogo) {
          localStorage.setItem('iea_custom_logo', remoteLogo);
          setLogoBase64(remoteLogo);
        } else {
          // If remote logo is empty but we have a reliable preloaded local logo, keep it and push it
          const localLogo = localStorage.getItem('iea_custom_logo') || '';
          if (localLogo) {
            setLogoBase64(localLogo);
            pushToCockroach({ logoBase64: localLogo });
          } else {
            setLogoBase64('');
            localStorage.removeItem('iea_custom_logo');
          }
        }

        // Handle signature sync
        if (remoteSignature) {
          localStorage.setItem('iea_custom_signature', remoteSignature);
          setSignatureBase64(remoteSignature);
        } else {
          // If remote signature is empty but we have a reliable preloaded local signature, keep it and push it
          const localSig = localStorage.getItem('iea_custom_signature') || '';
          if (localSig) {
            setSignatureBase64(localSig);
            pushToCockroach({ rectorSignature: localSig });
          } else {
            setSignatureBase64('');
            localStorage.removeItem('iea_custom_signature');
          }
        }
        
        triggerGlobalRefresh();
      } else {
        // Table exists but is completely empty. Warm it up with initial local settings!
        await pushToCockroach({});
      }
    } catch (e: any) {
      console.warn('Could not sync default config from CockroachDB. Using localStorage fallback.', e);
      setSyncStatus('error');
      setDbError(e.message || 'Error de red inesperado');
    } finally {
      setSyncing(false);
    }
  };

  // Push updates to CockroachDB using our API
  const pushToCockroach = async (updatedFields: {
    appName?: string;
    institutionName?: string;
    institutionDane?: string;
    institutionNit?: string;
    educationalLevel?: string;
    calendario?: string;
    footerMotto?: string;
    footerAddress?: string;
    footerEmails?: string;
    footerWebsite?: string;
    footerCity?: string;
    rectorName?: string;
    rectorDocument?: string;
    rectorCargo?: string;
    logoBase64?: string;
    rectorSignature?: string;
    ihsConfig?: { [subject: string]: string };
  }) => {
    try {
      // Prioritize incoming updates, next fallback to state variables, next to localStorage, final to default factory parameters
      const finalAppName = updatedFields.appName !== undefined ? updatedFields.appName : (appName || localStorage.getItem('iea_app_name') || 'App Gestión');
      const finalInstName = updatedFields.institutionName !== undefined ? updatedFields.institutionName : (institutionName || localStorage.getItem('alvernia_institution_name') || 'INSTITUCIÓN EDUCATIVA ALVERNIA');
      const finalInstDane = updatedFields.institutionDane !== undefined ? updatedFields.institutionDane : (institutionDane || localStorage.getItem('alvernia_institution_dane') || '186568000567');
      const finalInstNit = updatedFields.institutionNit !== undefined ? updatedFields.institutionNit : (institutionNit || localStorage.getItem('alvernia_institution_nit') || '891201897-5');
      const finalEduLevel = updatedFields.educationalLevel !== undefined ? updatedFields.educationalLevel : (educationalLevel || localStorage.getItem('alvernia_educational_level') || 'NIVEL PREESCOLAR – BÁSICA PRIMARIA Y MEDIA ACADÉMICA');
      const finalCal = updatedFields.calendario !== undefined ? updatedFields.calendario : (calendario || localStorage.getItem('alvernia_calendario') || 'CALENDARIO A');
      const finalMotto = updatedFields.footerMotto !== undefined ? updatedFields.footerMotto : (footerMotto || localStorage.getItem('alvernia_footer_motto') || '“Brindamos una educación humanística y académica para la excelencia de un ser humano integral”');
      const finalAddress = updatedFields.footerAddress !== undefined ? updatedFields.footerAddress : (footerAddress || localStorage.getItem('alvernia_footer_address') || 'Barrio San Martin Carrera 16 No. 12 – 77');
      const finalEmails = updatedFields.footerEmails !== undefined ? updatedFields.footerEmails : (footerEmails || localStorage.getItem('alvernia_footer_emails') || 'alvernia@sedputumayo.gov.co – rectoralvernia@gmail.com');
      const finalWebsite = updatedFields.footerWebsite !== undefined ? updatedFields.footerWebsite : (footerWebsite || localStorage.getItem('alvernia_footer_website') || 'www.ie-alvernia.edu.co');
      const finalCity = updatedFields.footerCity !== undefined ? updatedFields.footerCity : (footerCity || localStorage.getItem('alvernia_footer_city') || 'Puerto Asís - Putumayo');

      const finalRectorName = updatedFields.rectorName !== undefined 
        ? updatedFields.rectorName 
        : (rectorName || localStorage.getItem('iea_rector_name') || 'ESP. CARLOS ARCESIO ACOSTA CORONEL');

      const finalRectorDoc = updatedFields.rectorDocument !== undefined 
        ? updatedFields.rectorDocument 
        : (rectorDoc || localStorage.getItem('iea_rector_doc') || 'C.C. No. 87.246.722 de La Cruz');

      const finalRectorCargo = updatedFields.rectorCargo !== undefined 
        ? updatedFields.rectorCargo 
        : (rectorCargo || localStorage.getItem('iea_rector_cargo') || 'RECTOR');

      const finalLogo = updatedFields.logoBase64 !== undefined 
        ? updatedFields.logoBase64 
        : (logoBase64 || localStorage.getItem('iea_custom_logo') || '');

      const finalSignature = updatedFields.rectorSignature !== undefined 
        ? updatedFields.rectorSignature 
        : (signatureBase64 || localStorage.getItem('iea_custom_signature') || '');

      const finalIhsConfig = updatedFields.ihsConfig !== undefined
        ? updatedFields.ihsConfig
        : (ihsConfig || JSON.parse(localStorage.getItem('iea_ihs_config') || '{}'));

      const updateData = {
        appName: finalAppName,
        institutionName: finalInstName,
        institutionDane: finalInstDane,
        institutionNit: finalInstNit,
        educationalLevel: finalEduLevel,
        calendario: finalCal,
        footerMotto: finalMotto,
        footerAddress: finalAddress,
        footerEmails: finalEmails,
        footerWebsite: finalWebsite,
        footerCity: finalCity,
        rectorName: finalRectorName,
        rectorDocument: finalRectorDoc,
        rectorCargo: finalRectorCargo,
        logoBase64: finalLogo,
        rectorSignature: finalSignature,
        ihsConfig: finalIhsConfig
      };

      const response = await fetch('/api/alvernia/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      const data = await response.json();

      if (!data.success) {
        console.error('Error saving/uploading to CockroachDB table:', data.error);
        setSyncStatus('error');
        setDbError(data.error || 'Error de escritura');
      } else {
        setSyncStatus('synced');
        setDbError('');
      }
    } catch (e: any) {
      console.warn('Failed pushing config update to CockroachDB.', e);
      setSyncStatus('error');
      setDbError(e.message || 'Error de conexión');
    }
  };

  // Load initial configurations
  useEffect(() => {
    const storedApp = localStorage.getItem('iea_app_name') || 'App Gestión';
    const storedInst = localStorage.getItem('alvernia_institution_name') || 'INSTITUCIÓN EDUCATIVA ALVERNIA';
    const storedDane = localStorage.getItem('alvernia_institution_dane') || '186568000567';
    const storedNit = localStorage.getItem('alvernia_institution_nit') || '891201897-5';
    const storedLevel = localStorage.getItem('alvernia_educational_level') || 'NIVEL PREESCOLAR – BÁSICA PRIMARIA Y MEDIA ACADÉMICA';
    const storedCal = localStorage.getItem('alvernia_calendario') || 'CALENDARIO A';
    const storedMotto = localStorage.getItem('alvernia_footer_motto') || '“Brindamos una educación humanística y académica para la excelencia de un ser humano integral”';
    const storedAddress = localStorage.getItem('alvernia_footer_address') || 'Barrio San Martin Carrera 16 No. 12 – 77';
    const storedEmails = localStorage.getItem('alvernia_footer_emails') || 'alvernia@sedputumayo.gov.co – rectoralvernia@gmail.com';
    const storedWebsite = localStorage.getItem('alvernia_footer_website') || 'www.ie-alvernia.edu.co';
    const storedCity = localStorage.getItem('alvernia_footer_city') || 'Puerto Asís - Putumayo';

    const storedName = localStorage.getItem('iea_rector_name') || 'ESP. CARLOS ARCESIO ACOSTA CORONEL';
    const storedDoc = localStorage.getItem('iea_rector_doc') || 'C.C. No. 87.246.722 de La Cruz';
    const storedCargo = localStorage.getItem('iea_rector_cargo') || 'RECTOR';
    const storedLogo = localStorage.getItem('iea_custom_logo') || '';
    const storedSignature = localStorage.getItem('iea_custom_signature') || '';
    const storedIhs = JSON.parse(localStorage.getItem('iea_ihs_config') || '{}');

    setAppName(storedApp);
    setInstitutionName(storedInst);
    setInstitutionDane(storedDane);
    setInstitutionNit(storedNit);
    setEducationalLevel(storedLevel);
    setCalendario(storedCal);
    setFooterMotto(storedMotto);
    setFooterAddress(storedAddress);
    setFooterEmails(storedEmails);
    setFooterWebsite(storedWebsite);
    setFooterCity(storedCity);
    
    setRectorName(storedName);
    setRectorDoc(storedDoc);
    setRectorCargo(storedCargo);
    setLogoBase64(storedLogo);
    setSignatureBase64(storedSignature);
    setIhsConfig(storedIhs);

    // Dynamic sync from CockroachDB
    fetchFromCockroach();
  }, []);

  // Handle Logo Upload and Convert to Base64
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2000000) { // Limit to 2MB to fit comfortably in localStorage
      alert('Error: La imagen es demasiado grande. Seleccione un archivo menor a 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setLogoBase64(base64String);
      localStorage.setItem('iea_custom_logo', base64String);
      triggerGlobalRefresh();
      showSuccessIndicator();
      await pushToCockroach({ logoBase64: base64String });
    };
    reader.readAsDataURL(file);
  };

  // Handle Signature Upload and Convert to Base64
  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2000000) { // Limit to 2MB
      alert('Error: La imagen de la firma es demasiado grande. Seleccione un archivo menor a 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setSignatureBase64(base64String);
      localStorage.setItem('iea_custom_signature', base64String);
      triggerGlobalRefresh();
      showSuccessIndicator();
      await pushToCockroach({ rectorSignature: base64String });
    };
    reader.readAsDataURL(file);
  };

  // Trigger a custom event so other components refresh their states instantly
  const triggerGlobalRefresh = () => {
    window.dispatchEvent(new Event('iea_config_updated'));
  };

  // Show a temporary "Changes Saved" toast and auto-hide
  const showSuccessIndicator = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Save manual text fields
  const handleSaveTextSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameUpper = rectorName.toUpperCase();
    const cargoUpper = rectorCargo.toUpperCase();

    localStorage.setItem('iea_app_name', appName);
    localStorage.setItem('alvernia_institution_name', institutionName);
    localStorage.setItem('alvernia_institution_dane', institutionDane);
    localStorage.setItem('alvernia_institution_nit', institutionNit);
    localStorage.setItem('alvernia_educational_level', educationalLevel);
    localStorage.setItem('alvernia_calendario', calendario);
    localStorage.setItem('alvernia_footer_motto', footerMotto);
    localStorage.setItem('alvernia_footer_address', footerAddress);
    localStorage.setItem('alvernia_footer_emails', footerEmails);
    localStorage.setItem('alvernia_footer_website', footerWebsite);
    localStorage.setItem('alvernia_footer_city', footerCity);
    
    localStorage.setItem('iea_rector_name', nameUpper);
    localStorage.setItem('iea_rector_doc', rectorDoc);
    localStorage.setItem('iea_rector_cargo', cargoUpper);
    localStorage.setItem('iea_ihs_config', JSON.stringify(ihsConfig));
    
    // Also save a fallback flag in case user customized it
    localStorage.setItem('iea_config_customized', 'true');

    triggerGlobalRefresh();
    showSuccessIndicator();

    await pushToCockroach({
      appName,
      institutionName,
      institutionDane,
      institutionNit,
      educationalLevel,
      calendario,
      footerMotto,
      footerAddress,
      footerEmails,
      footerWebsite,
      footerCity,
      rectorName: nameUpper,
      rectorDocument: rectorDoc,
      rectorCargo: cargoUpper,
      ihsConfig
    });
  };

  // Restore Factory Defaults
  const handleResetDefaults = async () => {
    if (!confirm('¿Está seguro de restaurar los nombres, logotipos y firmas originales por defecto del colegio? (Esto también los reiniciará en la nube)')) return;
    
    localStorage.removeItem('iea_rector_name');
    localStorage.removeItem('iea_rector_doc');
    localStorage.removeItem('iea_rector_cargo');
    localStorage.removeItem('iea_config_customized');

    const defaultRectorName = 'ESP. CARLOS ARCESIO ACOSTA CORONEL';
    const defaultRectorDoc = 'C.C. No. 87.246.722 de La Cruz';
    const defaultRectorCargo = 'RECTOR';

    await pushToCockroach({
      rectorName: defaultRectorName,
      rectorDocument: defaultRectorDoc,
      rectorCargo: defaultRectorCargo
    });

    setRectorName(defaultRectorName);
    setRectorDoc(defaultRectorDoc);
    setRectorCargo(defaultRectorCargo);

    let logoBase64Reloaded = '';
    let sigBase64Reloaded = '';

    // Safe url to base64 fetcher block
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
        console.warn(`[Reset] Fallback fetch failed for ${url}:`, e);
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

    await pushToCockroach({
      rectorName: defaultRectorName,
      rectorDocument: defaultRectorDoc,
      rectorCargo: defaultRectorCargo,
      logoBase64: logoBase64Reloaded,
      rectorSignature: sigBase64Reloaded
    });
  };

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-2xl border border-emerald-100/80 shadow-sm" id="global-config-plantel-box">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/10 shrink-0">
            <Settings className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Ajustes de Institución (Logo, Firma y Rector)
              </h3>
              {syncStatus === 'syncing' && (
                <span className="inline-flex items-center gap-1.5 text-[8.5px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping shrink-0" />
                  Sincronizando con Nube...
                </span>
              )}
              {syncStatus === 'synced' && (
                <span className="inline-flex items-center gap-1.5 text-[8.5px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                  Conectado a CockroachDB (Sincronizado)
                </span>
              )}
              {syncStatus === 'error' && (
                <span className="inline-flex items-center gap-1.5 text-[8.5px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200 uppercase tracking-wide">
                  <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                  Sin Guardado en la Nube
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-tight mt-1">
              Sube tu logotipo y configura el nombre del Rector firmante para mantener la consistencia en todos tus formatos escolares en cualquier navegador.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase border border-slate-200 transition-all cursor-pointer shadow-sm shrink-0"
          id="btn-toggle-config-plantel"
        >
          {isOpen ? 'Ocultar Panel' : 'Configurar Logo / Rector'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-emerald-100/50 space-y-4" id="expanded-config-fields">
          
          {syncStatus === 'error' && (
            <div className="bg-rose-50/80 border border-rose-200 p-4 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-600 text-white rounded-lg mt-0.5 shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold text-rose-900 uppercase tracking-wide">
                    ⚠️ Acción Necesaria: Crear la tabla 'institucion_config' en Supabase
                  </h4>
                  <p className="text-[10px] text-rose-700 font-semibold mt-1 uppercase tracking-tight leading-normal">
                    La base de datos reportó el siguiente error: "{dbError || 'Falta la tabla o no hay permisos'}". Para que tu escudo, firma y datos del rector se guarden persistentemente en la nube y estén disponibles en cualquier dispositivo u otro navegador, ejecuta el siguiente script SQL en el panel de Supabase:
                  </p>
                </div>
              </div>
              
              <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[9px] select-all relative overflow-x-auto border border-slate-800">
                <div className="flex justify-between items-center mb-1 text-slate-400 font-sans text-[8px] font-bold uppercase tracking-wider">
                  <span>Código SQL para tu SQL Editor</span>
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`-- 1. Crear tabla para configuración institucional
CREATE TABLE IF NOT EXISTS public.institucion_config (
    id TEXT PRIMARY KEY,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    rector_name TEXT NOT NULL DEFAULT 'ESP. CARLOS ARCESIO ACOSTA CORONEL',
    rector_doc TEXT NOT NULL DEFAULT 'C.C. No. 87.246.722 de La Cruz',
    rector_cargo TEXT NOT NULL DEFAULT 'RECTOR',
    logo_base64 TEXT,
    signature_base64 TEXT
);

-- 2. Habilitar seguridad de nivel de fila (RLS)
ALTER TABLE public.institucion_config ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas públicas autónomas
CREATE POLICY "Permitir lectura general" ON public.institucion_config FOR SELECT USING (true);
CREATE POLICY "Permitir insertar/modificar general" ON public.institucion_config FOR ALL USING (true) WITH CHECK (true);`);
                      alert('¡Código SQL copiado! Pégalo en el panel "SQL Editor" de tu cuenta Supabase y haz clic en RUN.');
                    }}
                    className="hover:text-white bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700 cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-2.5 h-2.5" /> Copiar SQL
                  </button>
                </div>
                <pre className="text-[8.5px] leading-relaxed select-all text-emerald-400 font-mono">
{`CREATE TABLE IF NOT EXISTS public.institucion_config (
    id TEXT PRIMARY KEY,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    rector_name TEXT NOT NULL DEFAULT 'ESP. CARLOS ARCESIO ACOSTA CORONEL',
    rector_doc TEXT NOT NULL DEFAULT 'C.C. No. 87.246.722 de La Cruz',
    rector_cargo TEXT NOT NULL DEFAULT 'RECTOR',
    logo_base64 TEXT,
    signature_base64 TEXT
);

ALTER TABLE public.institucion_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura general" ON public.institucion_config FOR SELECT USING (true);
CREATE POLICY "Permitir insertar/modificar general" ON public.institucion_config FOR ALL USING (true) WITH CHECK (true);`}
                </pre>
              </div>
              
              <div className="text-[9px] bg-slate-50 text-slate-600 p-2.5 rounded-lg border border-slate-200 leading-snug font-medium uppercase tracking-tight">
                <strong>¿Cómo solucionarlo en 1 minuto?</strong><br />
                1. Abre tu panel de control de Supabase.<br />
                2. En el menú de la izquierda, haz clic en <strong>SQL Editor</strong> 💻.<br />
                3. Pulsa en <strong>New Query</strong>, pega el código superior que acabas de copiar y haz clic en <strong>Run</strong> ▶️.<br />
                4. Recarga la aplicación. ¡Eso es todo! Su escudo y firma nunca más se borrarán.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Section A: Upload Logo */}
            <div className="md:col-span-3 space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-inner flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1">
                  <Image className="w-3.5 h-3.5 text-emerald-500" />
                  Escudo / Logotipo
                </p>
                
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 border border-slate-200 bg-slate-50/50 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                    {logoBase64 ? (
                      <img src={logoBase64} alt="Institucional Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-center font-black text-slate-300 text-[9px] leading-tight flex flex-col items-center">
                        <span>SIN</span>
                        <span>LOGO</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-normal">
                    <p className="font-semibold text-slate-700 uppercase">Escudo Colegio</p>
                    <p className="text-[8px] leading-tight text-slate-400">Sube en formato PNG o JPG.</p>
                  </div>
                </div>
              </div>

              <div>
                <label 
                  htmlFor="upload-inst-logo-input"
                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-1.5 px-2 rounded-xl text-[9px] uppercase block text-center border border-emerald-200 transition-colors cursor-pointer"
                >
                  Cargar Logo
                </label>
                <input 
                  id="upload-inst-logo-input" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoChange} 
                  className="hidden" 
                />
              </div>
            </div>

            {/* Section B: Upload Signature */}
            <div className="md:col-span-3 space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-inner flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1">
                  <Image className="w-3.5 h-3.5 text-emerald-500" />
                  Firma del Rector
                </p>
                
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 border border-slate-200 bg-slate-50/50 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                    {signatureBase64 ? (
                      <img src={signatureBase64} alt="Rector Signature" className="w-full h-full object-contain bg-white" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-center font-black text-slate-300 text-[9px] leading-tight flex flex-col items-center">
                        <span>SIN</span>
                        <span>FIRMA</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-normal">
                    <p className="font-semibold text-slate-700 uppercase">Firma Rector</p>
                    <p className="text-[8px] leading-tight text-slate-400">Sube firma recortada (PNG/JPG).</p>
                  </div>
                </div>
              </div>

              <div>
                <label 
                  htmlFor="upload-inst-signature-input"
                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-1.5 px-2 rounded-xl text-[9px] uppercase block text-center border border-emerald-200 transition-colors cursor-pointer"
                >
                  Cargar Firma
                </label>
                <input 
                  id="upload-inst-signature-input" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleSignatureChange} 
                  className="hidden" 
                />
              </div>
            </div>

            {/* Section C: Edit Rector Name fields */}
            {/* Section C: Institutional Settings */}
            <form onSubmit={handleSaveTextSettings} className="md:col-span-12 bg-white p-4 rounded-xl border border-slate-100 shadow-inner space-y-6">
              
              {/* App / General */}
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1 flex items-center gap-1 border-b border-slate-100 pb-2">
                  <Settings className="w-3.5 h-3.5 text-emerald-500" />
                  Nombre de la Plataforma
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Nombre Corto App (Menú Lateral)</label>
                    <input type="text" value={appName} onChange={e => setAppName(e.target.value)} placeholder="Ej: App Gestión" className="w-full p-2 border border-slate-200 rounded-xl text-xs uppercase font-semibold text-slate-800 focus:outline-none focus:border-emerald-500" required />
                  </div>
                </div>
              </div>

              {/* IHS Mapping Settings */}
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1 flex items-center gap-1 border-b border-slate-100 pb-2">
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  Intensidad Horaria Semanal (IHS) Automática
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 mb-3 leading-snug">
                    Configura aquí las horas para cada materia. Cuando subas un archivo Excel al módulo de Certificados, 
                    el sistema detectará la materia y le asignará automáticamente esta Intensidad Horaria Semanal.
                  </p>
                  
                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      placeholder="Materia (Ej. MATEMÁTICAS)" 
                      value={newSubject}
                      onChange={e => setNewSubject(e.target.value)}
                      className="flex-1 p-2 border border-slate-300 rounded-lg text-xs uppercase"
                    />
                    <input 
                      type="number" 
                      placeholder="IHS" 
                      value={newIhs}
                      onChange={e => setNewIhs(e.target.value)}
                      className="w-24 p-2 border border-slate-300 rounded-lg text-xs text-center"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newSubject.trim() && newIhs.trim()) {
                          const updated = { ...ihsConfig, [newSubject.trim().toUpperCase()]: newIhs.trim() };
                          setIhsConfig(updated);
                          setNewSubject('');
                          setNewIhs('');
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                    >
                      Añadir
                    </button>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(ihsConfig).map(([subject, ihs]) => (
                      <div key={subject} className="flex justify-between items-center bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs">
                        <span className="font-semibold text-slate-700">{subject}</span>
                        <div className="flex items-center gap-3">
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono font-bold text-xs">{ihs} hrs</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...ihsConfig };
                              delete updated[subject];
                              setIhsConfig(updated);
                            }}
                            className="text-rose-500 hover:text-rose-700 font-bold px-2"
                          >
                            X
                          </button>
                        </div>
                      </div>
                    ))}
                    {Object.keys(ihsConfig).length === 0 && (
                      <p className="text-xs text-slate-400 italic text-center py-4 bg-white border border-slate-100 rounded-lg">
                        No hay materias configuradas.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Institution */}
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1 flex items-center gap-1 border-b border-slate-100 pb-2">
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  Identidad Institucional (Para Encabezados PDF)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Nombre Oficial Institución</label>
                    <input type="text" value={institutionName} onChange={e => setInstitutionName(e.target.value)} placeholder="Ej: INSTITUCIÓN EDUCATIVA ALVERNIA" className="w-full p-2 border border-slate-200 rounded-xl text-xs uppercase font-semibold text-slate-800 focus:outline-none focus:border-emerald-500" required />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Código DANE</label>
                    <input type="text" value={institutionDane} onChange={e => setInstitutionDane(e.target.value)} placeholder="Ej: 186568000567" className="w-full p-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">NIT</label>
                    <input type="text" value={institutionNit} onChange={e => setInstitutionNit(e.target.value)} placeholder="Ej: 891201897-5" className="w-full p-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Niveles Educativos / Resolución</label>
                    <input type="text" value={educationalLevel} onChange={e => setEducationalLevel(e.target.value)} placeholder="Ej: NIVEL PREESCOLAR – BÁSICA PRIMARIA Y MEDIA ACADÉMICA" className="w-full p-2 border border-slate-200 rounded-xl text-xs uppercase text-slate-800 focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Calendario</label>
                    <input type="text" value={calendario} onChange={e => setCalendario(e.target.value)} placeholder="Ej: CALENDARIO A" className="w-full p-2 border border-slate-200 rounded-xl text-xs uppercase text-slate-800 focus:outline-none focus:border-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1 flex items-center gap-1 border-b border-slate-100 pb-2">
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  Pie de Página (Para Documentos PDF)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Lema Institucional</label>
                    <input type="text" value={footerMotto} onChange={e => setFooterMotto(e.target.value)} placeholder="Ej: “Brindamos una educación humanística y académica...”" className="w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Dirección / Sede Principal</label>
                    <input type="text" value={footerAddress} onChange={e => setFooterAddress(e.target.value)} placeholder="Ej: Barrio San Martin Carrera 16 No. 12 – 77" className="w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Ciudad / Departamento</label>
                    <input type="text" value={footerCity} onChange={e => setFooterCity(e.target.value)} placeholder="Ej: Puerto Asís - Putumayo" className="w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Correos de Contacto</label>
                    <input type="text" value={footerEmails} onChange={e => setFooterEmails(e.target.value)} placeholder="Ej: correo1@edu.co - correo2@edu.co" className="w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Sitio Web</label>
                    <input type="text" value={footerWebsite} onChange={e => setFooterWebsite(e.target.value)} placeholder="Ej: www.ie-alvernia.edu.co" className="w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Rector */}
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1 flex items-center gap-1 border-b border-slate-100 pb-2">
                  <Award className="w-3.5 h-3.5 text-emerald-500" />
                  Identidad de Representación del Firmante
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Nombre Completo del Firmante</label>
                    <input
                      type="text"
                      value={rectorName}
                      onChange={e => setRectorName(e.target.value)}
                      placeholder="Ej: Lic. Carlos Acosta"
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs uppercase font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Documento Identificación</label>
                    <input
                      type="text"
                      value={rectorDoc}
                      onChange={e => setRectorDoc(e.target.value)}
                      placeholder="Ej: C.C. No. 87.246.722 de La Cruz"
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Cargo / Título Representativo</label>
                    <input
                      type="text"
                      value={rectorCargo}
                      onChange={e => setRectorCargo(e.target.value)}
                      placeholder="Ej: RECTOR"
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs uppercase font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Valores de Fábrica
                </button>

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2 px-4 rounded-xl text-[10px] uppercase transition-all shadow-md shadow-emerald-600/10 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Guardar Ajustes
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* Persistence feedback status toast */}
      {saveSuccess && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2.5 rounded-xl border border-emerald-500 shadow-xl text-xs font-bold tracking-normal uppercase z-50 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 shrink-0" />
          Ajustes Actualizados Exitosamente
        </div>
      )}
    </div>
  );
}
