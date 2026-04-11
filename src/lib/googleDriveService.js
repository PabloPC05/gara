/**
 * Servicio para interactuar con Google Workspace (Drive, Sheets, Docs)
 * 
 * Requiere:
 * - VITE_GOOGLE_CLIENT_ID en el archivo .env
 * - Habilitar Drive API, Sheets API y Docs API en Google Cloud Console.
 */

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const DOCS_API_URL = 'https://docs.googleapis.com/v1/documents';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

let tokenClient;
let accessToken = null;

/**
 * Retorna el token de acceso actual (si existe).
 */
export const getAccessToken = () => accessToken;

/**
 * Inicializa el cliente de identidad de Google.
 * No bloquea; solo configura el objeto global.
 */
export const initGoogleIdentity = (clientId) => {
  if (typeof google === 'undefined') {
    console.error('Google Identity Services script not loaded');
    return;
  }

  if (tokenClient) return; // Ya inicializado

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/documents'
    ].join(' '),
    callback: (response) => {
      if (response.error !== undefined) {
        console.error('Error de Google Auth:', response);
        return;
      }
      accessToken = response.access_token;
      // El resolve se maneja en el flujo de solicitud del token
    },
  });
};

/**
 * Solicita o refresca el token de acceso de forma interactiva si es necesario.
 */
const getValidToken = () => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Identity Client no inicializado. Llama a initGoogleIdentity primero.'));
      return;
    }

    tokenClient.callback = (response) => {
      if (response.error) {
        reject(response);
      } else {
        accessToken = response.access_token;
        resolve(accessToken);
      }
    };

    // Si ya tenemos un token, intentamos usarlo. Si falla, el usuario tendrá que re-autorizar.
    // Para simplificar, siempre solicitamos uno si no hay o si queremos asegurar frescura.
    tokenClient.requestAccessToken({ prompt: accessToken ? '' : 'consent' });
  });
};

/**
 * Crea una carpeta en Drive para organizar los resultados.
 */
async function createFolder(name, token) {
  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };

  const response = await fetch(DRIVE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });
  
  if (!response.ok) throw new Error('Error al crear carpeta en Drive');
  return await response.json();
}

/**
 * Exporta resultados completos a Google Workspace.
 */
export const exportResultsToWorkspace = async ({ proteinName, summaryText, paeJsonData, metrics }) => {
  const token = await getValidToken();

  // 1. Crear Carpeta Contenedora
  const folder = await createFolder(`BioHack - ${proteinName} - ${new Date().toLocaleDateString()}`, token);
  const folderId = folder.id;

  const results = {
    folderUrl: `https://drive.google.com/drive/u/0/folders/${folderId}`,
    files: []
  };

  // 2. Crear Google Doc con el Resumen
  try {
    const doc = await createGoogleDoc(`Resumen: ${proteinName}`, summaryText, folderId, token);
    results.files.push({ name: 'Documento de Resumen', url: `https://docs.google.com/document/d/${doc.id}/edit` });
  } catch (err) {
    console.error('Error creando Doc:', err);
    // Fallback a .txt si falla el Doc
    await uploadFile({
      name: `Resumen_${proteinName}.txt`,
      mimeType: 'text/plain',
      content: summaryText,
      parentId: folderId,
      token
    });
  }

  // 3. Crear Google Sheet con Métricas (si existen)
  if (metrics || paeJsonData) {
    try {
      const sheet = await createGoogleSheet(`Métricas: ${proteinName}`, metrics || paeJsonData, folderId, token);
      results.files.push({ name: 'Hoja de Métricas', url: `https://docs.google.com/spreadsheets/d/${sheet.id}/edit` });
    } catch (err) {
      console.error('Error creando Sheet:', err);
      // Fallback a .json
      if (paeJsonData) {
        await uploadFile({
          name: `Metricas_${proteinName}.json`,
          mimeType: 'application/json',
          content: JSON.stringify(paeJsonData, null, 2),
          parentId: folderId,
          token
        });
      }
    }
  }

  return results;
};

/**
 * Crea un Google Doc.
 */
async function createGoogleDoc(title, content, parentId, token) {
  // Crear el archivo en Drive primero para especificar la carpeta
  const metadata = {
    name: title,
    mimeType: 'application/vnd.google-apps.document',
    parents: [parentId]
  };

  const createResponse = await fetch(DRIVE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  const docFile = await createResponse.json();
  
  // Insertar contenido usando Docs API
  // El contenido de Docs API es complejo, para este MVP insertamos texto simple al inicio.
  const requests = [
    {
      insertText: {
        location: { index: 1 },
        text: content
      }
    }
  ];

  await fetch(`${DOCS_API_URL}/${docFile.id}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  return docFile;
}

/**
 * Crea una Google Sheet.
 */
async function createGoogleSheet(title, data, parentId, token) {
  const metadata = {
    name: title,
    mimeType: 'application/vnd.google-apps.spreadsheet',
    parents: [parentId]
  };

  const createResponse = await fetch(DRIVE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  const sheetFile = await createResponse.json();

  // Si data es un objeto plano, lo convertimos a filas para la hoja
  let rows = [];
  if (Array.isArray(data)) {
    rows = data;
  } else if (typeof data === 'object') {
    rows = Object.entries(data).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : v]);
  }

  if (rows.length > 0) {
    await fetch(`${SHEETS_API_URL}/${sheetFile.id}/values/A1:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows
      }),
    });
  }

  return sheetFile;
}

/**
 * Subida genérica de archivos a Drive.
 */
async function uploadFile({ name, mimeType, content, parentId, token }) {
  const metadata = {
    name: name,
    parents: [parentId],
    mimeType: mimeType
  };

  // Usamos el formato multipart manual para asegurar compatibilidad
  const boundary = 'foo_bar_baz';
  const delimiter = `--${boundary}`;
  const closeDelimiter = `--${boundary}--`;

  const body = 
    delimiter + '\r\n' +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) + '\r\n' +
    delimiter + '\r\n' +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content + '\r\n' +
    closeDelimiter;

  await fetch(UPLOAD_API_URL.replace('uploadType=multipart', `uploadType=multipart&boundary=${boundary}`), {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: body,
  });
}

// Mantener export old para compatibilidad mientras se migra
export const exportResultsToDrive = exportResultsToWorkspace;
