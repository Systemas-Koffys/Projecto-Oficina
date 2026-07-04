/**
 * Sincronizador de PodarApp (Google Sheets / AppSheet) a Firestore (Firebase)
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. En tu hoja de Google Sheets, ve a: Extensiones -> Apps Script.
 * 2. Borra todo el código del archivo Código.gs y pega este script.
 * 3. Configura las credenciales de tu Cuenta de Servicio de Firebase en la sección de CONFIGURACIÓN abajo.
 * 4. Guarda el proyecto.
 * 5. Ejecuta la función `probarSincronizacion` para verificar que todo conecta.
 * 6. Configura un activador (Trigger) para que se ejecute automáticamente cada 5 o 10 minutos (Activadores -> Añadir activador).
 */

// ==========================================
// ⚙️ CONFIGURACIÓN DEL SISTEMA
// ==========================================
const PROJECT_ID = "sistema-arboricultura-tarija";

// Genera una llave de Cuenta de Servicio en Firebase: 
// Firebase Console -> Configuración de Proyecto -> Cuentas de Servicio -> Generar nueva clave privada.
const FIREBASE_CLIENT_EMAIL = "TU_CLIENT_EMAIL_AQUÍ";
const FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nTU_PRIVATE_KEY_AQUÍ\n-----END PRIVATE KEY-----";

// Mapeo de columnas de tu Google Sheet (Ajusta los índices, 0 es la columna A, 1 es B, etc.)
const COL_ID_SOLICITUD = 0;      // Columna A: ID de la Solicitud (ej. SOL-017/26 o ID interno)
const COL_ESTADO_TRAMITE = 4;    // Columna E: Estado del Trámite ("En espera" o "Terminado")
const COL_DETALLES_VERIF = 5;    // Columna F: Detalles de verificación del técnico
const COL_FECHA_VERIF = 6;       // Columna G: Fecha de verificación

// ==========================================
// 🚀 FUNCIÓN PRINCIPAL DE SINCRONIZACIÓN
// ==========================================
function syncSheetsToFirestore() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    Logger.log("No hay datos para procesar en la hoja.");
    return;
  }
  
  // Obtener el Token de Acceso para Firestore
  const token = getFirestoreAccessToken(FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY);
  if (!token) {
    Logger.log("Error: No se pudo obtener el token de acceso.");
    return;
  }

  Logger.log("Token obtenido correctamente. Iniciando escaneo de filas...");

  // Recorrer filas (comenzando en la fila 1 para saltar la cabecera)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const idSolicitud = String(row[COL_ID_SOLICITUD]).trim();
    const estado = String(row[COL_ESTADO_TRAMITE]).trim();
    const detalles = String(row[COL_DETALLES_VERIF]).trim();
    const fecha = String(row[COL_FECHA_VERIF]).trim();
    
    // Validar que tengamos un ID válido
    if (!idSolicitud || idSolicitud === "undefined" || idSolicitud === "") {
      continue;
    }

    // Filtrar únicamente los estados permitidos para sincronizar ("En espera" y "Terminado")
    if (estado !== "En espera" && estado !== "Terminado") {
      continue;
    }

    Logger.log("Procesando solicitud: " + idSolicitud + " con estado: " + estado);
    
    try {
      // Actualizar Firestore usando la API REST mediante un método PATCH (para no sobreescribir otros datos)
      const firestoreUrl = "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID + "/databases/(default)/documents/solicitudes/" + idSolicitud + "?updateMask.fieldPaths=estado_tramite&updateMask.fieldPaths=detalles_verificacion&updateMask.fieldPaths=fecha_verificacion";
      
      const payload = {
        fields: {
          estado_tramite: { stringValue: estado },
          detalles_verificacion: { stringValue: detalles },
          fecha_verificacion: { stringValue: fecha }
        }
      };
      
      const options = {
        method: "patch",
        contentType: "application/json",
        headers: {
          "Authorization": "Bearer " + token
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      
      const response = UrlFetchApp.fetch(firestoreUrl, options);
      const resCode = response.getResponseCode();
      
      if (resCode === 200) {
        Logger.log("✅ Sincronizado con éxito: " + idSolicitud);
      } else {
        Logger.log("❌ Error al sincronizar " + idSolicitud + ". Código: " + resCode + ". Respuesta: " + response.getContentText());
      }
      
    } catch (err) {
      Logger.log("⚠️ Error en fila " + (i + 1) + ": " + err.toString());
    }
  }
}

// ==========================================
// 🔑 GENERADOR DE TOKEN JWT OAUTH2 PARA GOOGLE
// ==========================================
function getFirestoreAccessToken(email, key) {
  const header = JSON.stringify({ alg: "RS256", typ: "JWT" });
  const claimSet = JSON.stringify({
    iss: email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  });
  
  const encodedHeader = base64EncodeSafe(header);
  const encodedClaimSet = base64EncodeSafe(claimSet);
  const signatureInput = encodedHeader + "." + encodedClaimSet;
  
  const signature = Utilities.computeRsaSha256Signature(signatureInput, key);
  const encodedSignature = base64EncodeBytes(signature);
  const jwt = signatureInput + "." + encodedSignature;
  
  const response = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
    method: "post",
    contentType: "application/x-www-form-urlencoded",
    payload: "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" + jwt,
    muteHttpExceptions: true
  });
  
  if (response.getResponseCode() === 200) {
    const resData = JSON.parse(response.getContentText());
    return resData.access_token;
  }
  
  Logger.log("Error al autenticar: " + response.getContentText());
  return null;
}

function base64EncodeSafe(str) {
  return Utilities.base64EncodeWebSafe(Utilities.newBlob(str).getBytes()).replace(/=+$/, "");
}

function base64EncodeBytes(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, "");
}

// ==========================================
// 🧪 FUNCIÓN DE PRUEBA DE CONEXIÓN
// ==========================================
function probarConexion() {
  const token = getFirestoreAccessToken(FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY);
  if (token) {
    Logger.log("🎉 ¡Conexión con Firebase Firestore establecida con éxito! El token es válido.");
  } else {
    Logger.log("❌ Falló la conexión. Revisa tus credenciales de la Cuenta de Servicio.");
  }
}
