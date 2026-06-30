const apiKey = import.meta.env.VITE_GROQ_API_KEY;

// Endpoint de Groq (compatible con la API de OpenAI)
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Modelo de Groq: LLaMA 3.3 70B — versión actual estable
const MODEL = 'llama-3.3-70b-versatile';

/**
 * Consulta al asistente IA de ArborGest usando la API de Groq (LLaMA 3.1).
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

  // Simplificar inventario para el prompt
  const inventarioSimplificado = (contexto.inventarioItems || []).map(item => {
    const stock = (contexto.inventarioConsumibles || []).find(c => c.id_item === item.id_item);
    return {
      nombre: item.nombre,
      tipo: item.tipo,
      categoria: item.categoria || 'Sin categoría',
      stock_almacen: stock?.cantidad_almacen ?? (item.tipo === 'Activo' ? 'N/A' : 0),
      unidad: item.unidad || ''
    };
  });

  const activosSimplificados = (contexto.inventarioActivos || []).map(a => ({
    nombre: (contexto.inventarioItems || []).find(i => i.id_item === a.id_item)?.nombre || `Item ${a.id_item}`,
    codigo: a.codigo_activo,
    estado: a.estado,
    custodio: (contexto.tecnicos || []).find(t => t.id_tecnico === a.id_custodio)?.nombre || a.id_custodio || 'Sin custodio'
  }));

  const movimientosPendientes = (contexto.inventarioMovimientos || [])
    .filter(m => m.estado_devolucion === 'Pendiente devolución')
    .slice(0, 30)
    .map(m => ({
      item: (contexto.inventarioItems || []).find(i => i.id_item === m.id_item)?.nombre || `Item ${m.id_item}`,
      cantidad: m.cantidad,
      responsable: (contexto.tecnicos || []).find(t => t.id_tecnico === m.id_tecnico_responsable)?.nombre || m.id_tecnico_responsable
    }));

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `Eres "ArborGest AI", el asistente inteligente oficial de la Unidad de Mantenimiento de Ornato Público y Área de Arboricultura del Gobierno Autónomo Municipal de Tarija (G.A.M.T.).
Tu objetivo es ayudar a los funcionarios municipales a consultar el estado de solicitudes de poda, tala y emergencias arbóreas, además de información sobre el personal y catálogos del sistema.
Responde SIEMPRE en español. Sé claro, conciso y profesional. Usa viñetas cuando sea útil para organizar la información.
Usa ÚNICAMENTE el contexto del sistema como fuente de verdad. No inventes datos.`
          },
          {
            role: 'user',
            content: `CONTEXTO DEL SISTEMA (datos reales de la base de datos):
- Total de solicitudes registradas: ${(contexto.solicitudes || []).length}
- Solicitudes (últimas 80): ${JSON.stringify(solicitudesSimplificadas)}
- Personal y cuadrillas: ${JSON.stringify(personalSimplificado)}
- Catálogo de herramientas e inventario (${inventarioSimplificado.length} ítems): ${JSON.stringify(inventarioSimplificado)}
- Activos fijos con custodio (${activosSimplificados.length} activos): ${JSON.stringify(activosSimplificados)}
- Préstamos pendientes de devolución (${movimientosPendientes.length}): ${JSON.stringify(movimientosPendientes)}

PREGUNTA DEL FUNCIONARIO: "${pregunta}"`
          }
        ],
        temperature: 0.5,
        max_tokens: 800,
        stream: false
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Error API Groq:', errData);
      throw new Error(`HTTP ${response.status}: ${errData?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || 'No se pudo obtener una respuesta.';

  } catch (error) {
    console.error('Error al consultar Groq:', error);
    throw error;
  }
}
