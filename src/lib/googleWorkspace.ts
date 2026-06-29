import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  browserSessionPersistence,
  setPersistence
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Novedad, Employee } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Keep access token and user info in-memory
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Set persistence to SESSION so closing the tab logs out/clears session tokens safely
setPersistence(auth, browserSessionPersistence).catch(err => {
  console.error("Error setting session persistence:", err);
});

export const initGoogleAuth = (
  onSuccess: (user: User, token: string) => void,
  onFailure: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user && cachedAccessToken) {
      onSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      onFailure();
    }
  });
};

export const signInWithGoogleWorkspace = async (): Promise<{ user: User; token: string } | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/spreadsheets');
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    
    // Force prompt to ensure the user gets a fresh access token with correct permissions
    provider.setCustomParameters({
      prompt: 'consent'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error('No se pudo obtener el token de acceso de Google Auth');
    }

    cachedAccessToken = token;
    return { user: result.user, token };
  } catch (error) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logoutGoogleWorkspace = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export const getWorkspaceAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Creates a new Spreadsheet in Google Drive using the File Create API
 */
export const createGoogleSheetDatabase = async (accessToken: string, title: string): Promise<{ id: string; url: string }> => {
  try {
    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: title,
        mimeType: 'application/vnd.google-apps.spreadsheet'
      })
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`Fallo al crear hoja de cálculo en Drive: ${errorMsg}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      url: `https://docs.google.com/spreadsheets/d/${data.id}/edit`
    };
  } catch (error) {
    console.error('Error en createGoogleSheetDatabase:', error);
    throw error;
  }
};

/**
 * Lists Spreadsheets created by our app to find if one exists
 */
export const findExistingSheet = async (accessToken: string, titleName: string): Promise<string | null> => {
  try {
    const q = encodeURIComponent(`name = '${titleName}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (err) {
    console.error('Error al buscar hoja existente:', err);
    return null;
  }
};

/**
 * Returns a readable name for Documento Soporte Type
 */
const getDocTipoLabel = (tipo: string): string => {
  switch (tipo) {
    case 'R': return 'Resolución';
    case 'D': return 'Decreto';
    case 'A': return 'Acta';
    case 'I': return 'Incapacidad';
    case 'P': return 'Permiso';
    case 'O': return 'Otro';
    default: return 'No especificado';
  }
};

/**
 * Syncs the local list of novedades into a specific Spreadsheet
 */
export const syncNovedadesToSheet = async (
  accessToken: string, 
  spreadsheetId: string, 
  novedades: Novedad[], 
  employeesDict: Record<string, Employee>
): Promise<void> => {
  try {
    // 1. Fetch metadata to find the exact sheet name of the first tab
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!metaRes.ok) {
      throw new Error(`No se pudo obtener metadatos de la hoja de cálculo (${metaRes.status})`);
    }

    const metaData = await metaRes.json();
    const sheetName = metaData.sheets?.[0]?.properties?.title || 'Sheet1';

    // 2. Clear old contents to ensure fresh overwrite
    const clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!A1:Z2000:clear`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!clearRes.ok) {
      console.warn("No se pudo limpiar la hoja (tal vez es nueva), continuando...");
    }

    // 3. Build data grid
    const headers = [
      'ID REGISTRO',
      'CÉDULA FUNCIONARIO',
      'NOMBRE COMPLETO',
      'CARGO / DETALLE',
      'SEDE DE TRABAJO',
      'CLASE DE NOVEDAD / PERMISO',
      'SEDE DONDE SE PRESENTÓ',
      'FECHA INICIO',
      'FECHA FIN',
      '¿LABORANDO NORMALMENTE?',
      '¿REGISTRA CARGA ACADÉMICA?',
      'TIPO DE DOCUMENTO SOPORTE',
      'NÚMERO DE SOPORTE',
      'FECHA DOCUMENTO SOPORTE',
      'OBSERVACIONES / DETALLE'
    ];

    const rows = novedades.map(nov => {
      const emp = employeesDict[nov.empleadoId];
      return [
        nov.id || '',
        nov.empleadoId || '',
        emp?.nombre || 'Funcionario Desconocido',
        emp?.cargo || '',
        emp?.sedeTrabajo || '',
        nov.claseNovedad || '',
        nov.sedeNovedad || '',
        nov.fechaInicio ? nov.fechaInicio.replace('T', ' ') : '',
        nov.fechaFin ? nov.fechaFin.replace('T', ' ') : '',
        nov.estaLaborandoNormalmente || 'No',
        nov.seLeAsignoCargaAcademica || 'No',
        getDocTipoLabel(nov.documentoSoporteTipo),
        nov.documentoSoporteNo || '',
        nov.documentoSoporteFecha || '',
        nov.observaciones || ''
      ];
    });

    const values = [headers, ...rows];

    // 4. Overwrite Hoja with the new entries grid
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: `'${sheetName}'!A1`,
          majorDimension: 'ROWS',
          values: values
        })
      }
    );

    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      throw new Error(`Error al actualizar valores en Sheets: ${errorText}`);
    }

    // 5. Stylize/Format the headers optionally (bold text and colored background) via BatchUpdate for that polished look
    const sheetId = metaData.sheets?.[0]?.properties?.sheetId || 0;
    const styleBody = {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: headers.length
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.117, green: 0.227, blue: 0.541 }, // custom navy color resembling IEA #1e3a8a
                textFormat: {
                  bold: true,
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  fontSize: 10
                },
                horizontalAlignment: 'CENTER'
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
          }
        },
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId: sheetId,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: headers.length
            }
          }
        }
      ]
    };

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(styleBody)
    }).catch(e => {
      console.warn("Fallo menor al aplicar estilos en Sheets, pero los datos se guardaron:", e);
    });

  } catch (error) {
    console.error('Error al sincronizar novedades en Sheets:', error);
    throw error;
  }
};
