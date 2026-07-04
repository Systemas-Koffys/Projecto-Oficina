const apiKey = import.meta.env.VITE_GROQ_API_KEY;

// Endpoint de Groq (compatible con la API de OpenAI)
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Modelo de Groq: LLaMA 3.3 70B — versión actual estable
const MODEL = 'llama-3.3-70b-versatile'/**
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

  // Se priorizan las solicitudes relevantes filtradas por el buscador local
  const solicitudesOrigen = (contexto.solicitudesRelevantes || contexto.solicitudes || []).filter(s => s != null);
  const solicitudesSimplificadas = solicitudesOrigen.slice(0, 120).map(s => {
    const barrioNombre = (contexto.barrios || []).find(b => b && String(b.id) === String(s.id_barrio))?.nombre || `ID: ${s.id_barrio}`;
    const distritoNombre = (contexto.distritos || []).find(d => d && String(d.id) === String(s.id_distrito))?.nombre || `D-${s.id_distrito}`;
    return {
      codigo: s.codigo_anual || s.id_solicitud,
      solicitante: s.solicitante_nombre,
      barrio: barrioNombre,
      distrito: distritoNombre,
      calle: s.calle,
      estado: s.estado_tramite,
      arboles: (s.arboles || []).filter(a => a != null).map(a => ({
        especie: (contexto.especies || []).find(e => e && String(e.id) === String(a.id_especie))?.nombre || 'N/A',
        accion: (contexto.acciones || []).find(ac => ac && String(ac.id) === String(a.id_accion_realizar))?.nombre || 'N/A'
      }))
    };
  });

  // Estadísticas globales de solicitudes para respuestas estadísticas completas
  const totalSolicitudes = (contexto.solicitudes || []).filter(s => s != null).length;
  const porEstado = {
    'En espera': (contexto.solicitudes || []).filter(s => s && s.estado_tramite === 'En espera').length,
    'En proceso': (contexto.solicitudes || []).filter(s => s && s.estado_tramite === 'En proceso').length,
    'Terminado': (contexto.solicitudes || []).filter(s => s && s.estado_tramite === 'Terminado').length
  };

  const personalSimplificado = (contexto.tecnicos || []).filter(t => t != null).map(t => ({
    nombre: t.nombre,
    cargo: t.cargo,
    estado: t.estado,
    celular: t.celular || 'N/A',
    en_linea: t.online ? 'Sí' : 'No'
  }));

  const inventarioSimplificado = (contexto.inventarioItems || []).filter(item => item != null).map(item => {
    const stock = (contexto.inventarioConsumibles || []).find(c => c && c.id_item === item.id_item);
    return {
      nombre: item.nombre,
      tipo: item.tipo,
      categoria: item.categoria || 'Sin categoría',
      stock_almacen: stock?.cantidad_almacen ?? (item.tipo === 'Activo' ? 'N/A' : 0),
      unidad: item.unidad || ''
    };
  });

  const activosSimplificados = (contexto.inventarioActivos || []).filter(a => a != null).map(a => ({
    nombre: (contexto.inventarioItems || []).find(i => i && i.id_item === a.id_item)?.nombre || `Item ${a.id_item}`,
    codigo: a.codigo_activo,
    estado: a.estado,
    custodio: (contexto.tecnicos || []).find(t => t && t.id_tecnico === a.id_custodio)?.nombre || a.id_custodio || 'Sin custodio'
  }));

  const movimientosPendientes = (contexto.inventarioMovimientos || [])
    .filter(m => m != null && m.estado_devolucion === 'Pendiente devolución')
    .slice(0, 20)
    .map(m => ({
      item: (contexto.inventarioItems || []).find(i => i && i.id_item === m.id_item)?.nombre || `Item ${m.id_item}`,
      cantidad: m.cantidad,
      responsable: (contexto.tecnicos || []).find(t => t && t.id_tecnico === m.id_tecnico_responsable)?.nombre || m.id_tecnico_responsable
    }));

  // --- NUEVAS FUENTES DE DATOS ---
  // Usuarios del sistema (seguro: sin datos de autenticación sensibles)
  const usuariosSimplificados = (contexto.usuarios || []).filter(u => u != null).map(u => ({
    nombre: u.nombre || u.username,
    rol: u.role || 'USER',
    estado: u.estado || 'Activo'
  }));

  // Historial de reportes impresos recientemente
  const impresionesSimplificadas = (contexto.impresiones || []).filter(i => i != null).slice(0, 15).map(i => ({
    tipo: i.tipo_reporte,
    fecha: i.fecha_impresion,
    usuario: i.usuario_nombre
  }));

  // Calendario festivo y aniversarios con contacto
  const calendarioSimplificado = (contexto.calendario || []).filter(c => c != null).map(c => ({
    titulo: c.nombre_barrio,
    fecha: c.fecha_aniversario || c.fecha,
    contacto: c.presidente_barrio ? `${c.presidente_barrio} (Tel: ${c.telefono_presidente || 'N/A'})` : 'N/A'
  }));

  // Logs de auditoría reciente (usuario, acción, fecha)
  const auditoriaSimplificada = (contexto.auditoria || []).filter(a => a != null).slice(0, 20).map(a => ({
    usuario: a.usuario_nombre || a.usuario_email || 'Sistema',
    accion: a.accion,
    detalles: a.detalles,
    fecha: a.fecha_hora_formateada || a.fecha_hora
  }));

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
