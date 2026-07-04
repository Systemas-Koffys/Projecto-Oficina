const apiKey = import.meta.env.VITE_GROQ_API_KEY;

// Endpoint de Groq (compatible con la API de OpenAI)
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Modelo de Groq: LLaMA 3.1 8B — alta velocidad y mayores límites de cuota gratis
const MODEL = 'llama-3.1-8b-instant';

/**
 * Obtiene el código del trámite priorizando la comunicación interna
 * (tal como se muestra en la interfaz del sistema).
 */
const getCodigoTramite = (s) => {
  if (!s) return '—';
  if (s.comunicacion_interna && s.comunicacion_interna.trim() !== '') {
    return s.comunicacion_interna.trim();
  }
  if (s.codigo_anual) {
    return s.codigo_anual.startsWith('SOL-') ? s.codigo_anual : `SOL-${s.codigo_anual}`;
  }
  return `#${s.id_solicitud}`;
};

/**
 * Consulta al asistente IA de ArborGest usando la API de Groq (LLaMA 3.3).
 * 
 * @param {string} pregunta Pregunta del usuario por voz o texto.
 * @param {object} contexto Contexto de la base de datos (solicitudes, tecnicos, catalogos, etc.).
 * @param {array} historial Historial de los últimos mensajes de la conversación.
 * @returns {Promise<string>} Respuesta de la IA.
 */
export async function askGemini(pregunta, contexto = {}, historial = []) {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API_KEY_MISSING');
  }

  // Se priorizan las solicitudes relevantes filtradas por el buscador local (máximo 20 para conservar tokens)
  const solicitudesOrigen = (contexto.solicitudesRelevantes || contexto.solicitudes || [])
    .filter(s => s != null)
    .slice(0, 20);

  const solicitudesSimplificadas = solicitudesOrigen.map(s => {
    const barrioNombre = (contexto.barrios || []).find(b => b && String(b.id) === String(s.id_barrio))?.nombre || `Barrio ID: ${s.id_barrio}`;
    const distritoNombre = (contexto.distritos || []).find(d => d && String(d.id) === String(s.id_distrito))?.nombre || `D-${s.id_distrito}`;
    const arbolesTexto = (s.arboles || []).filter(a => a != null).map(a => {
      const esp = (contexto.especies || []).find(e => e && String(e.id) === String(a.id_especie))?.nombre || 'N/A';
      const acc = (contexto.acciones || []).find(ac => ac && String(ac.id) === String(a.id_accion_realizar))?.nombre || 'N/A';
      return `${esp} (${acc})`;
    }).join(', ');

    const codigo = getCodigoTramite(s);
    return `${codigo} | Solicitante: ${s.solicitante_nombre || 'N/A'} | Barrio: ${barrioNombre} (${distritoNombre}) | Calle: ${s.calle || 'N/A'} | Estado: ${s.estado_tramite || 'En espera'} | Trabajos: ${arbolesTexto || 'Sin detalle'}`;
  });

  // Estadísticas globales de solicitudes para respuestas estadísticas completas
  const totalSolicitudes = (contexto.solicitudes || []).filter(s => s != null).length;
  const porEstado = {
    'En espera': (contexto.solicitudes || []).filter(s => s && s.estado_tramite === 'En espera').length,
    'En proceso': (contexto.solicitudes || []).filter(s => s && s.estado_tramite === 'En proceso').length,
    'Terminado': (contexto.solicitudes || []).filter(s => s && s.estado_tramite === 'Terminado').length
  };

  // Personal municipal (Strings planos)
  const personalSimplificado = (contexto.tecnicos || [])
    .filter(t => t != null)
    .map(t => `${t.nombre} (${t.cargo || 'Técnico'}) | Estado: ${t.estado} | Cel: ${t.celular || 'N/A'} | En línea: ${t.online ? 'Sí' : 'No'}`);

  // Catálogo de herramientas e inventario (Strings planos, limitados a 15)
  const inventarioSimplificado = (contexto.inventarioItems || [])
    .filter(item => item != null)
    .slice(0, 15)
    .map(item => {
      const stock = (contexto.inventarioConsumibles || []).find(c => c && c.id_item === item.id_item);
      const cant = stock?.cantidad_almacen ?? 0;
      return `${item.nombre} (${item.tipo}) | Categoría: ${item.categoria || 'Sin categoría'} | Stock: ${cant} ${item.unidad || ''}`;
    });

  // Activos fijos (Strings planos, limitados a 10)
  const activosSimplificados = (contexto.inventarioActivos || [])
    .filter(a => a != null)
    .slice(0, 10)
    .map(a => {
      const nombre = (contexto.inventarioItems || []).find(i => i && i.id_item === a.id_item)?.nombre || `Item ${a.id_item}`;
      const custodio = (contexto.tecnicos || []).find(t => t && t.id_tecnico === a.id_custodio)?.nombre || 'Sin custodio';
      return `${a.codigo_activo} - ${nombre} (Estado: ${a.estado}) | Custodio: ${custodio}`;
    });

  // Préstamos pendientes (Strings planos, limitados a 8)
  const movimientosPendientes = (contexto.inventarioMovimientos || [])
    .filter(m => m != null && m.estado_devolucion === 'Pendiente devolución')
    .slice(0, 8)
    .map(m => {
      const item = (contexto.inventarioItems || []).find(i => i && i.id_item === m.id_item)?.nombre || `Item ${m.id_item}`;
      const responsable = (contexto.tecnicos || []).find(t => t && t.id_tecnico === m.id_tecnico_responsable)?.nombre || 'N/A';
      return `${item} (${m.cantidad} uds) prestado a ${responsable}`;
    });

  // --- NUEVAS FUENTES DE DATOS ---
  // Usuarios del sistema (seguro: sin datos de autenticación sensibles, limitados a 10)
  const usuariosSimplificados = (contexto.usuarios || [])
    .filter(u => u != null)
    .slice(0, 10)
    .map(u => `${u.nombre || u.username} (Rol: ${u.role || 'USER'}) | Estado: ${u.estado || 'Activo'}`);

  // Historial de reportes impresos recientemente (limitado a 5)
  const impresionesSimplificadas = (contexto.impresiones || [])
    .filter(i => i != null)
    .slice(0, 5)
    .map(i => `${i.tipo_reporte} por ${i.usuario_nombre} el ${i.fecha_impresion}`);

  // Calendario festivo y aniversarios con contacto (limitado a 10)
  const calendarioSimplificado = (contexto.calendario || [])
    .filter(c => c != null)
    .slice(0, 10)
    .map(c => `${c.nombre_barrio} (Fecha: ${c.fecha_aniversario || c.fecha}) | Contacto: ${c.presidente_barrio || 'N/A'} (Tel: ${c.telefono_presidente || 'N/A'})`);

  // Logs de auditoría reciente (usuario, acción, fecha, limitado a 8)
  const auditoriaSimplificada = (contexto.auditoria || [])
    .filter(a => a != null)
    .slice(0, 8)
    .map(a => `${a.usuario_nombre || 'Sistema'} realizó ${a.accion} (${a.detalles}) el ${a.fecha_hora_formateada || a.fecha_hora}`);

  try {
    // 1. Mensaje de sistema básico
    const apiMessages = [
      {
        role: 'system',
        content: `Eres "ArborGest AI", el asistente inteligente oficial de la Unidad de Mantenimiento de Ornato Público y Área de Arboricultura del Gobierno Autónomo Municipal de Tarija (G.A.M.T.).
Tu objetivo es ayudar a los funcionarios municipales a consultar el estado de solicitudes de poda, tala, emergencias arbóreas, personal de campo, inventario, calendario municipal y auditoría del sistema.
Responde SIEMPRE en español. Sé claro, conciso y profesional. Usa viñetas cuando sea útil para organizar la información.
Usa ÚNICAMENTE el contexto del sistema como fuente de verdad. No inventes datos.`
      }
    ];

    // 2. Inyección del historial de conversación (últimos mensajes)
    if (historial && historial.length > 0) {
      historial.forEach(msg => {
        apiMessages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // 3. Pregunta actual concatenada con el contexto real enriquecido
    apiMessages.push({
      role: 'user',
      content: `CONTEXTO DEL SISTEMA (datos reales de la base de datos):
- Total de solicitudes en el sistema: ${totalSolicitudes} (En espera: ${porEstado['En espera']}, En proceso: ${porEstado['En proceso']}, Terminadas: ${porEstado['Terminado']})
- Solicitudes relevantes o recientes analizadas (máx. 120): ${JSON.stringify(solicitudesSimplificadas)}
- Personal municipal y estado de presencia: ${JSON.stringify(personalSimplificado)}
- Inventario general y stock en almacén: ${JSON.stringify(inventarioSimplificado)}
- Activos fijos y asignación de custodios: ${JSON.stringify(activosSimplificados)}
- Préstamos de herramientas pendientes de devolución: ${JSON.stringify(movimientosPendientes)}
- Calendario festivo (aniversarios de barrios y feriados): ${JSON.stringify(calendarioSimplificado)}
- Usuarios registrados en el sistema y sus roles: ${JSON.stringify(usuariosSimplificados)}
- Historial de reportes impresos recientemente: ${JSON.stringify(impresionesSimplificadas)}
${contexto.auditoria ? `- Auditoría (últimas acciones del sistema): ${JSON.stringify(auditoriaSimplificada)}` : ''}

PREGUNTA DEL FUNCIONARIO: "${pregunta}"`
    });

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: apiMessages,
        temperature: 0.4,
        max_tokens: 850,
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
