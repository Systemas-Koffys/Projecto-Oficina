import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Llama a la API de Gemini 1.5 Flash inyectando la pregunta del usuario y el contexto de Firestore.
 * 
 * @param {string} pregunta Pregunta del usuario por voz o texto.
 * @param {object} contexto Contexto de la base de datos (solicitudes, tecnicos, catalogos).
 * @returns {Promise<string>} Respuesta de la IA.
 */
export async function askGemini(pregunta, contexto = {}) {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API_KEY_MISSING');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Usamos gemini-1.5-flash por su velocidad y gratuidad, forzando la versión estable v1 de la API
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash'
  }, {
    apiVersion: 'v1'
  });

  // Simplificamos las solicitudes para optimizar los tokens y enviar la mayor cantidad posible
  const solicitudesSimplificadas = (contexto.solicitudes || []).slice(0, 100).map(s => {
    // Buscar nombre del barrio
    const barrioNombre = (contexto.barrios || []).find(b => String(b.id) === String(s.id_barrio))?.nombre || `ID: ${s.id_barrio}`;
    const distritoNombre = (contexto.distritos || []).find(d => String(d.id) === String(s.id_distrito))?.nombre || `D-${s.id_distrito}`;
    
    return {
      codigo: s.codigo_anual || s.id_solicitud,
      solicitante: s.solicitante_nombre,
      telefono: s.solicitante_telefono,
      barrio: barrioNombre,
      distrito: distritoNombre,
      calle: s.calle,
      estado: s.estado_tramite,
      arboles: (s.arboles || []).map(a => ({
        especie: (contexto.especies || []).find(e => String(e.id) === String(a.id_especie))?.nombre || 'Especie no catalogada',
        accion_solicitada: (contexto.acciones || []).find(ac => String(ac.id) === String(a.id_accion_solicitada))?.nombre || 'Acción no catalogada',
        accion_realizar: (contexto.acciones || []).find(ac => String(ac.id) === String(a.id_accion_realizar))?.nombre || 'Acción no catalogada'
      }))
    };
  });

  // Simplificar personal
  const personalSimplificado = (contexto.tecnicos || []).map(t => ({
    nombre: t.nombre,
    cargo: t.cargo,
    role: t.role,
    estado: t.estado,
    equipo: t.id_equipo || 'Sin equipo'
  }));

  const promptCompleto = `
[INSTRUCCIONES DE COMPORTAMIENTO (ACTÚA BAJO ESTAS REGLAS)]
Eres "ArborGest AI", el asistente inteligente oficial de la Unidad de Mantenimiento de Ornato Público y Área de Arboricultura del Gobierno Autónomo Municipal de Tarija (G.A.M.T.).
Tu objetivo es ayudar a los funcionarios a consultar y entender el estado de las solicitudes de poda, tala, emergencias, catalogos de barrios y personal del municipio.
Responde siempre en español de forma clara, profesional, con calidez y sumamente concisa. Usa un formato limpio con viñetas si es necesario.
Usa el contexto del sistema como tu única fuente de verdad para responder preguntas específicas sobre solicitudes, barrios, distritos y técnicos asignados.
Si te preguntan por voz, responde con oraciones cortas fáciles de escuchar.

[CONTEXTO REAL DEL SISTEMA]
- Total solicitudes en base de datos: ${(contexto.solicitudes || []).length}
- Últimas 100 solicitudes (formateadas): ${JSON.stringify(solicitudesSimplificadas)}
- Personal / Cuadrillas: ${JSON.stringify(personalSimplificado)}

[PREGUNTA DEL FUNCIONARIO]
"${pregunta}"
`;

  try {
    const result = await model.generateContent(promptCompleto);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error al generar contenido con Gemini:', error);
    throw error;
  }
}
