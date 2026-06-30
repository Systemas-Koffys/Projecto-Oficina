const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Llama a la API de Gemini usando fetch nativo con el token OAuth2 (AQ.) de Google AI Studio.
 * Esto es necesario ya que el SDK @google/generative-ai no soporta tokens de tipo AQ.
 * 
 * @param {string} pregunta Pregunta del usuario por voz o texto.
 * @param {object} contexto Contexto de la base de datos (solicitudes, tecnicos, catalogos).
 * @returns {Promise<string>} Respuesta de la IA.
 */
export async function askGemini(pregunta, contexto = {}) {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API_KEY_MISSING');
  }

  // Simplificamos las solicitudes para optimizar los tokens
  const solicitudesSimplificadas = (contexto.solicitudes || []).slice(0, 80).map(s => {
    const barrioNombre = (contexto.barrios || []).find(b => String(b.id) === String(s.id_barrio))?.nombre || `ID: ${s.id_barrio}`;
    const distritoNombre = (contexto.distritos || []).find(d => String(d.id) === String(s.id_distrito))?.nombre || `D-${s.id_distrito}`;
    return {
      codigo: s.codigo_anual || s.id_solicitud,
      solicitante: s.solicitante_nombre,
      barrio: barrioNombre,
      distrito: distritoNombre,
      calle: s.calle,
      estado: s.estado_tramite,
      arboles: (s.arboles || []).map(a => ({
        especie: (contexto.especies || []).find(e => String(e.id) === String(a.id_especie))?.nombre || 'N/A',
        accion: (contexto.acciones || []).find(ac => String(ac.id) === String(a.id_accion_realizar))?.nombre || 'N/A'
      }))
    };
  });

  const personalSimplificado = (contexto.tecnicos || []).map(t => ({
    nombre: t.nombre,
    cargo: t.cargo,
    estado: t.estado
  }));

  const promptCompleto = `Eres "ArborGest AI", el asistente inteligente oficial del área de Arboricultura del Gobierno Autónomo Municipal de Tarija (G.A.M.T.). Responde siempre en español, de forma clara y concisa.

CONTEXTO DEL SISTEMA:
- Total solicitudes: ${(contexto.solicitudes || []).length}
- Solicitudes (últimas 80): ${JSON.stringify(solicitudesSimplificadas)}
- Personal: ${JSON.stringify(personalSimplificado)}

PREGUNTA: "${pregunta}"`;

  // Detectar si es una clave OAuth2 (AQ.) o una API Key tradicional (AIzaSy)
  const isOAuthToken = apiKey.startsWith('AQ.');

  try {
    let responseText = '';

    if (isOAuthToken) {
      // --- Ruta OAuth2: fetch directo con Bearer token ---
      const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: promptCompleto }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('Error API Gemini OAuth:', errData);
        throw new Error(`HTTP ${res.status}: ${errData?.error?.message || res.statusText}`);
      }

      const data = await res.json();
      responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta del servidor.';

    } else {
      // --- Ruta API Key tradicional: URL con key param ---
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: promptCompleto }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('Error API Gemini Key:', errData);
        throw new Error(`HTTP ${res.status}: ${errData?.error?.message || res.statusText}`);
      }

      const data = await res.json();
      responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta del servidor.';
    }

    return responseText;

  } catch (error) {
    console.error('Error al consultar Gemini:', error);
    throw error;
  }
}
