// =============================================================================
// ARBORGEST << PODARAPP SYNC SCRIPT
// Sincronizacion unidireccional: Google Sheets (PodarApp) >> Firestore (ArborGest)
// Version: 1.0.0 | Fase 1 - Solo lectura sobre Sheets
// =============================================================================
//
// INSTRUCCIONES DE CONFIGURACION:
// 1. En Google Apps Script, ve a "Proyecto" >> "Propiedades del script"
// 2. Agrega las siguientes propiedades con los valores de tu Service Account:
//    - SA_CLIENT_EMAIL  >> client_email del archivo .json
//    - SA_PRIVATE_KEY   >> private_key del archivo .json (incluyendo -----BEGIN/END-----)
//    - FIRESTORE_PROJECT >> sistema-arboricultura-tarija
// 3. Guarda y ejecuta syncPodarAppToFirestore() manualmente la primera vez.
// 4. Para automatizar, ve a "Disparadores" y agrega un trigger de tiempo (ej: cada hora).
// =============================================================================

function getConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    clientEmail: props.getProperty('SA_CLIENT_EMAIL'),
    privateKey: props.getProperty('SA_PRIVATE_KEY').replace(/\\n/g, '\n'),
    projectId: props.getProperty('FIRESTORE_PROJECT') || 'sistema-arboricultura-tarija'
  };
}

// =============================================================================
// FUNCION PRINCIPAL
// =============================================================================
function syncPodarAppToFirestore() {
  var startTime = new Date();
  var log = { fecha: startTime.toISOString(), sincronizados: [], advertencias: [], errores: [], resumen: {} };

  try {
    Logger.log('Iniciando sincronizacion PodarApp >> ArborGest...');
    var token = getFirestoreToken();
    if (!token) throw new Error('No se pudo obtener el token. Verifica las Script Properties SA_CLIENT_EMAIL y SA_PRIVATE_KEY.');

    var catalogos = cargarCatalogos(token);
    Logger.log('Catalogos cargados: Barrios=' + catalogos.barrios.length + ' Especies=' + catalogos.especies.length + ' Acciones=' + catalogos.acciones.length + ' Tecnicos=' + catalogos.tecnicos.length);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaBase = ss.getSheetByName('basededatos');
    var hojaDetalle = ss.getSheetByName('DetalleDeArboles');
    if (!hojaDetalle) hojaDetalle = ss.getSheetByName('DetalleDeÁrboles');

    if (!hojaBase) throw new Error('No se encontro la hoja "basededatos".');

    var datosBase = hojaBase.getDataRange().getValues();
    var datosDetalle = hojaDetalle ? hojaDetalle.getDataRange().getValues() : [[]];

    var headersBase = datosBase[0];
    var headersDetalle = datosDetalle[0] || [];

    var arbolesAdicionales = indexarArbolesAdicionales(datosDetalle, headersDetalle);

    var filasValidas = datosBase.slice(1).filter(function(fila) {
      var estado = getVal(fila, headersBase, 'Estado');
      return estado && ['EN ESPERA', 'TERMINADO'].indexOf(estado.toString().trim().toUpperCase()) >= 0;
    });

    Logger.log('Registros validos: ' + filasValidas.length + ' de ' + (datosBase.length - 1) + ' filas.');

    // Descargar TODAS las solicitudes existentes en Firestore en una sola carga paginada
    Logger.log('Descargando solicitudes existentes de Firestore...');
    var solicitudesExistentes = cargarTodasLasSolicitudes(token);
    Logger.log('Solicitudes descargadas en memoria: ' + Object.keys(solicitudesExistentes).length);

    filasValidas.forEach(function(fila, idx) {
      var comInt = getVal(fila, headersBase, 'Comunicacion interna');
      if (!comInt) {
        log.advertencias.push({ fila: idx + 2, motivo: 'Comunicacion interna vacia, fila ignorada.' });
        return;
      }
      try {
        var docExistente = solicitudesExistentes[comInt.toString()];
        var resultado = procesarFilaOptimizada(fila, headersBase, arbolesAdicionales, catalogos, token, docExistente);
        if (resultado.exito && resultado.accion !== 'SIN_CAMBIOS') {
          log.sincronizados.push({ comInt: comInt, accion: resultado.accion });
          Logger.log('OK [' + comInt + '] ' + resultado.accion);
        } else if (!resultado.exito) {
          log.advertencias.push({ comInt: comInt, motivo: resultado.motivo });
          Logger.log('AVISO [' + comInt + '] ' + resultado.motivo);
        }
      } catch(e) {
        log.errores.push({ comInt: comInt, error: e.message });
        Logger.log('ERROR [' + comInt + ']: ' + e.message);
      }
    });

    // Crear conjunto (set) de todas las Comunicaciones Internas que existen en el Excel
    var codigosEnExcel = {};
    filasValidas.forEach(function(fila) {
      var comInt = getVal(fila, headersBase, 'Comunicacion interna');
      if (comInt) {
        codigosEnExcel[comInt.toString().trim()] = true;
      }
    });

    // Comparar y eliminar de Firestore las que ya no existen en Excel (con periodo de gracia de 30 minutos)
    var cfg = getConfig();
    var now = new Date();
    Object.keys(solicitudesExistentes).forEach(function(comInt) {
      if (!codigosEnExcel[comInt.trim()]) {
        var doc = solicitudesExistentes[comInt];
        var fuente = doc.fields && doc.fields._fuente_sync && doc.fields._fuente_sync.stringValue;
        if (fuente === 'podarapp') {
          // Periodo de gracia de 30 minutos para evitar borrar registros recién creados en ArborGest
          var createdAtVal = doc.fields && doc.fields.createdAt && (doc.fields.createdAt.timestampValue || doc.fields.createdAt.stringValue);
          if (createdAtVal) {
            var createdDate = new Date(createdAtVal);
            var diffMs = now.getTime() - createdDate.getTime();
            var diffMin = diffMs / (1000 * 60);
            if (diffMin < 30) {
              Logger.log('AVISO [' + comInt + '] Omitiendo eliminación porque fue creado hace ' + Math.round(diffMin) + ' minutos (periodo de gracia).');
              return;
            }
          }
          try {
            var docId = doc.name.split('/').pop();
            eliminarDeFirestore(token, cfg.projectId, docId);
            log.sincronizados.push({ comInt: comInt, accion: 'ELIMINADO_POR_FALTA_EN_EXCEL' });
            Logger.log('OK [' + comInt + '] ELIMINADO de Firestore porque no existe en la planilla de Google Sheets.');
          } catch(e) {
            log.errores.push({ comInt: comInt, error: 'Error al eliminar de Firestore: ' + e.message });
            Logger.log('ERROR al eliminar de Firestore [' + comInt + ']: ' + e.message);
          }
        }
      }
    });

  } catch(e) {
    log.errores.push({ error: 'ERROR GLOBAL: ' + e.message });
    Logger.log('ERROR GLOBAL: ' + e.message);
  }

  log.resumen = {
    duracion_ms: new Date() - startTime,
    total_sincronizados: log.sincronizados.length,
    total_advertencias: log.advertencias.length,
    total_errores: log.errores.length
  };

  Logger.log('=== RESUMEN === Sincronizados:' + log.resumen.total_sincronizados + ' Advertencias:' + log.resumen.total_advertencias + ' Errores:' + log.resumen.total_errores + ' Duracion:' + log.resumen.duracion_ms + 'ms');
  guardarLog(log);
  return log;
}

// =============================================================================
// PROCESAMIENTO DE CADA FILA
// =============================================================================
function procesarFila(fila, headers, arbolesAdicionales, catalogos, token) {
  var cfg = getConfig();
  var comInt = getVal(fila, headers, 'Comunicacion interna');

  // Mapeo de campos
  var estadoRaw = getVal(fila, headers, 'Estado');
  var estado = mapEstado(estadoRaw);
  var distritoTexto = getVal(fila, headers, 'Distrito');
  var barrioTexto = getVal(fila, headers, 'Barrio');
  var barrioRes = resolverBarrio(distritoTexto, barrioTexto, catalogos.barrios);
  var especieRes = resolverPorNombre(getVal(fila, headers, 'Especie de Arbol'), catalogos.especies, 'especie');
  var accionRealizarRes = resolverPorNombre(getVal(fila, headers, 'Accion a Realizar'), catalogos.acciones, 'accion_realizar');
  var accionSolicRes = resolverPorNombre(getVal(fila, headers, 'Lo Solicitado'), catalogos.acciones, 'accion_solicitada');
  var tecVerifRes = resolverTecnico(getVal(fila, headers, 'Tecnico de Verificacion'), catalogos.tecnicos);
  var tecEjecRes = resolverTecnico(getVal(fila, headers, 'Tecnico de Ejecucion'), catalogos.tecnicos);
  var gps = parsearGPS(getVal(fila, headers, 'Ubicacion gps'));
  var fechaIngreso = convertirFechaExcel(getVal(fila, headers, 'Fecha de Ingreso'));
  var fechaEjecucion = convertirFechaExcel(getVal(fila, headers, 'Fecha de Ejecucion'));
  var tipoInstRes = resolverPorNombre(getVal(fila, headers, 'Institucion'), catalogos.tipos_institucion, 'tipo_institucion');
  var nombreInstRes = resolverPorNombre(getVal(fila, headers, 'Lista instituciones'), catalogos.instituciones, 'institucion');

  // Array de arboles
  var arbolPrincipal = {
    id_especie: especieRes.id,
    id_accion_solicitada: accionSolicRes.id,
    id_accion_realizar: accionRealizarRes.id,
    observaciones_arbol: getVal(fila, headers, 'Observacion de Verificacion') || '',
    url_foto: null,
    realizado: false
  };

  var arbolesExtra = (arbolesAdicionales[comInt.toString()] || []).map(function(arb) {
    return {
      id_especie: resolverPorNombre(arb.especie, catalogos.especies, 'especie').id,
      id_accion_solicitada: null,
      id_accion_realizar: resolverPorNombre(arb.accion, catalogos.acciones, 'accion').id,
      observaciones_arbol: arb.observacion || '',
      url_foto: null,
      realizado: mapBoolean(arb.realizado),
      podar_id_detalle: arb.id_detalle
    };
  });

  var arboles = [arbolPrincipal].concat(arbolesExtra);

  // Documento final
  var doc = {
    comunicacion_interna: comInt.toString(),
    id_barrio: barrioRes.id,
    barrio_texto_podar: barrioRes.id ? null : barrioTexto,
    calle: getVal(fila, headers, 'Calles') || '',
    numero_casa: (getVal(fila, headers, 'N de Casa') || getVal(fila, headers, 'N\u00b0 de Casa') || '').toString(),
    referencia: getVal(fila, headers, 'Referencias') || '',
    solicitante_nombre: getVal(fila, headers, 'Solicitante') || '',
    solicitante_telefono: (getVal(fila, headers, 'Telefono') || '').toString(),
    lat: gps.lat,
    lng: gps.lng,
    fecha_ingreso: fechaIngreso,
    fecha_verificacion: mapBoolean(getVal(fila, headers, 'Verificado')) ? fechaIngreso : null,
    id_tecnico_verificacion: tecVerifRes.id,
    verificado: mapBoolean(getVal(fila, headers, 'Verificado')),
    requiere_plataforma: mapBoolean(getVal(fila, headers, 'Requiere Plataforma')),
    requiere_setar: mapBoolean(getVal(fila, headers, 'Requiere Setar')),
    requiere_ficha_tecnica: mapBoolean(getVal(fila, headers, 'Requiere Ficha Tecnica')),
    procede: mapBoolean(getVal(fila, headers, 'Procede')),
    nivel_urgencia: mapUrgencia(getVal(fila, headers, 'Urgencia')),
    observacion_verificacion: getVal(fila, headers, 'Observacion de Verificacion') || '',
    id_tecnico_ejecucion: tecEjecRes.id,
    fecha_ejecucion: fechaEjecucion,
    observaciones_finales: getVal(fila, headers, 'Observacion de Ejecucion') || '',
    estado_tramite: estado,
    arboles: arboles,
    usuario_podar: getVal(fila, headers, 'USUARIO') || '',
    id_tipo_institucion: tipoInstRes.id,
    id_nombre_institucional: nombreInstRes.id,
    _fuente_sync: 'podarapp',
    _ultima_sync: new Date(),
    createdAt: new Date()
  };

  // Verificar si ya existe en Firestore (Caso A o B)
  var docExistente = buscarEnFirestore(token, cfg.projectId, comInt.toString());
  if (docExistente) {
    var docId = docExistente.name.split('/').pop();
    actualizarEnFirestore(token, cfg.projectId, docId, doc);
    return { exito: true, accion: 'ACTUALIZADO (Caso A)' };
  } else {
    var docIdNuevo = 'podar_' + comInt.toString().replace(/\//g, '-');
    crearEnFirestore(token, cfg.projectId, docIdNuevo, doc);
    return { exito: true, accion: 'CREADO (Caso B)' };
  }
}

function procesarFilaOptimizada(fila, headers, arbolesAdicionales, catalogos, token, docExistente) {
  var cfg = getConfig();
  var comInt = getVal(fila, headers, 'Comunicacion interna');

  // Mapeo de campos
  var estadoRaw = getVal(fila, headers, 'Estado');
  var estado = mapEstado(estadoRaw);
  var distritoTexto = getVal(fila, headers, 'Distrito');
  var barrioTexto = getVal(fila, headers, 'Barrio');
  var barrioRes = resolverBarrio(distritoTexto, barrioTexto, catalogos.barrios);
  var especieRes = resolverPorNombre(getVal(fila, headers, 'Especie de Arbol'), catalogos.especies, 'especie');
  var accionRealizarRes = resolverPorNombre(getVal(fila, headers, 'Accion a Realizar'), catalogos.acciones, 'accion_realizar');
  var accionSolicRes = resolverPorNombre(getVal(fila, headers, 'Lo Solicitado'), catalogos.acciones, 'accion_solicitada');
  var tecVerifRes = resolverTecnico(getVal(fila, headers, 'Tecnico de Verificacion'), catalogos.tecnicos);
  var tecEjecRes = resolverTecnico(getVal(fila, headers, 'Tecnico de Ejecucion'), catalogos.tecnicos);
  var gps = parsearGPS(getVal(fila, headers, 'Ubicacion gps'));
  var fechaIngreso = convertirFechaExcel(getVal(fila, headers, 'Fecha de Ingreso'));
  var fechaEjecucion = convertirFechaExcel(getVal(fila, headers, 'Fecha de Ejecucion'));
  var verificado = mapBoolean(getVal(fila, headers, 'Verificado'));
  var requierePlataforma = mapBoolean(getVal(fila, headers, 'Requiere Plataforma'));
  var requiereSetar = mapBoolean(getVal(fila, headers, 'Requiere Setar'));
  var requiereFicha = mapBoolean(getVal(fila, headers, 'Requiere Ficha Tecnica'));
  var procede = mapBoolean(getVal(fila, headers, 'Procede'));
  var nivelUrgencia = mapUrgencia(getVal(fila, headers, 'Urgencia'));
  var observacionVerif = getVal(fila, headers, 'Observacion de Verificacion') || '';
  var observacionEjec = getVal(fila, headers, 'Observacion de Ejecucion') || '';
  var tipoInstRes = resolverPorNombre(getVal(fila, headers, 'Institucion'), catalogos.tipos_institucion, 'tipo_institucion');
  var nombreInstRes = resolverPorNombre(getVal(fila, headers, 'Lista instituciones'), catalogos.instituciones, 'institucion');

  // Array de arboles
  var arbolPrincipal = {
    id_especie: especieRes.id,
    id_accion_solicitada: accionSolicRes.id,
    id_accion_realizar: accionRealizarRes.id,
    observaciones_arbol: observacionVerif,
    url_foto: null,
    realizado: false
  };

  var arbolesExtra = (arbolesAdicionales[comInt.toString()] || []).map(function(arb) {
    return {
      id_especie: resolverPorNombre(arb.especie, catalogos.especies, 'especie').id,
      id_accion_solicitada: null,
      id_accion_realizar: resolverPorNombre(arb.accion, catalogos.acciones, 'accion').id,
      observaciones_arbol: arb.observacion || '',
      url_foto: null,
      realizado: mapBoolean(arb.realizado),
      podar_id_detalle: arb.id_detalle
    };
  });

  var arboles = [arbolPrincipal].concat(arbolesExtra);

  // Documento final
  var doc = {
    comunicacion_interna: comInt.toString(),
    id_barrio: barrioRes.id,
    barrio_texto_podar: barrioRes.id ? null : barrioTexto,
    calle: getVal(fila, headers, 'Calles') || '',
    numero_casa: (getVal(fila, headers, 'N de Casa') || getVal(fila, headers, 'N\u00b0 de Casa') || '').toString(),
    referencia: getVal(fila, headers, 'Referencias') || '',
    solicitante_nombre: getVal(fila, headers, 'Solicitante') || '',
    solicitante_telefono: (getVal(fila, headers, 'Telefono') || '').toString(),
    lat: gps.lat,
    lng: gps.lng,
    fecha_ingreso: fechaIngreso,
    fecha_verificacion: verificado ? fechaIngreso : null,
    id_tecnico_verificacion: tecVerifRes.id,
    verificado: verificado,
    requiere_plataforma: requierePlataforma,
    requiere_setar: requiereSetar,
    requiere_ficha_tecnica: requiereFicha,
    procede: procede,
    nivel_urgencia: nivelUrgencia,
    observacion_verificacion: observacionVerif,
    id_tecnico_ejecucion: tecEjecRes.id,
    fecha_ejecucion: fechaEjecucion,
    observaciones_finales: observacionEjec,
    estado_tramite: estado,
    arboles: arboles,
    usuario_podar: getVal(fila, headers, 'USUARIO') || '',
    id_tipo_institucion: tipoInstRes.id,
    id_nombre_institucional: nombreInstRes.id,
    _fuente_sync: 'podarapp',
    _ultima_sync: new Date(),
    createdAt: new Date()
  };

  if (docExistente) {
    // CASO A: Comparar si hay diferencias antes de llamar a Firestore
    var fields = docExistente.fields || {};
    var esDiferente = (
      !fields.createdAt ||
      obtenerValorSimple(fields.estado_tramite) !== estado ||
      obtenerValorSimple(fields.verificado) !== verificado ||
      obtenerValorSimple(fields.fecha_verificacion) !== (verificado ? fechaIngreso : null) ||
      obtenerValorSimple(fields.id_barrio) !== barrioRes.id ||
      obtenerValorSimple(fields.id_tecnico_verificacion) !== tecVerifRes.id ||
      obtenerValorSimple(fields.id_tecnico_ejecucion) !== tecEjecRes.id ||
      obtenerValorSimple(fields.observacion_verificacion) !== observacionVerif ||
      obtenerValorSimple(fields.observaciones_finales) !== observacionEjec ||
      obtenerValorSimple(fields.requiere_plataforma) !== requierePlataforma ||
      obtenerValorSimple(fields.requiere_setar) !== requiereSetar ||
      obtenerValorSimple(fields.requiere_ficha_tecnica) !== requiereFicha ||
      obtenerValorSimple(fields.procede) !== procede ||
      obtenerValorSimple(fields.nivel_urgencia) !== nivelUrgencia ||
      obtenerValorSimple(fields.id_tipo_institucion) !== tipoInstRes.id ||
      obtenerValorSimple(fields.id_nombre_institucional) !== nombreInstRes.id
    );

    if (!esDiferente) {
      return { exito: true, accion: 'SIN_CAMBIOS' };
    }

    var docId = docExistente.name.split('/').pop();
    actualizarEnFirestore(token, cfg.projectId, docId, doc);
    return { exito: true, accion: 'ACTUALIZADO (Caso A)' };
  } else {
    // CASO B: Crear documento nuevo
    var docIdNuevo = 'podar_' + comInt.toString().replace(/\//g, '-');
    crearEnFirestore(token, cfg.projectId, docIdNuevo, doc);
    return { exito: true, accion: 'CREADO (Caso B)' };
  }
}

function obtenerValorSimple(field) {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return parseInt(field.integerValue);
  if (field.doubleValue !== undefined) return parseFloat(field.doubleValue);
  if (field.booleanValue !== undefined) return field.booleanValue;
  return null;
}

// =============================================================================
// FIRESTORE REST API
// =============================================================================
function getFirestoreToken() {
  var cfg = getConfig();
  var now = Math.floor(Date.now() / 1000);
  var header = Utilities.base64EncodeWebSafe(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  var claim = Utilities.base64EncodeWebSafe(JSON.stringify({
    iss: cfg.clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }));
  var signInput = header + '.' + claim;
  var signature = Utilities.base64EncodeWebSafe(Utilities.computeRsaSha256Signature(signInput, cfg.privateKey));
  var jwt = signInput + '.' + signature;

  var response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt,
    muteHttpExceptions: true
  });
  var result = JSON.parse(response.getContentText());
  return result.access_token || null;
}

function buscarEnFirestore(token, projectId, comInt) {
  var url = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents:runQuery';
  var query = {
    structuredQuery: {
      from: [{ collectionId: 'solicitudes' }],
      where: { fieldFilter: { field: { fieldPath: 'comunicacion_interna' }, op: 'EQUAL', value: { stringValue: comInt } } },
      limit: 1
    }
  };
  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify(query),
    muteHttpExceptions: true
  });
  var results = JSON.parse(response.getContentText());
  if (Array.isArray(results) && results[0] && results[0].document) return results[0].document;
  return null;
}

function cargarTodasLasSolicitudes(token) {
  var cfg = getConfig();
  var url = 'https://firestore.googleapis.com/v1/projects/' + cfg.projectId + '/databases/(default)/documents:runQuery';
  
  var query = {
    structuredQuery: {
      from: [{ collectionId: 'solicitudes' }],
      where: {
        fieldFilter: {
          field: { fieldPath: '_fuente_sync' },
          op: 'EQUAL',
          value: { stringValue: 'podarapp' }
        }
      }
    }
  };
  
  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify(query),
    muteHttpExceptions: true
  });
  
  var results = JSON.parse(response.getContentText());
  var solicitudes = {};
  
  if (Array.isArray(results)) {
    results.forEach(function(res) {
      if (res.document) {
        var doc = res.document;
        var comInt = doc.fields && doc.fields.comunicacion_interna && doc.fields.comunicacion_interna.stringValue;
        if (comInt) {
          solicitudes[comInt.toString()] = doc;
        }
      }
    });
  }
  
  return solicitudes;
}

function crearEnFirestore(token, projectId, docId, data) {
  var url = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/solicitudes/' + docId;
  UrlFetchApp.fetch(url, {
    method: 'patch',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ fields: toFirestoreFields(data) }),
    muteHttpExceptions: true
  });
}

function actualizarEnFirestore(token, projectId, docId, data) {
  var campos = ['estado_tramite','verificado','fecha_verificacion','requiere_plataforma','requiere_setar','requiere_ficha_tecnica','procede','nivel_urgencia','observacion_verificacion','observaciones_finales','id_tecnico_verificacion','id_tecnico_ejecucion','fecha_ejecucion','arboles','usuario_podar','_fuente_sync','_ultima_sync','lat','lng','barrio_texto_podar','createdAt','id_barrio','id_tipo_institucion','id_nombre_institucional'];
  var updateMask = campos.map(function(f) { return 'updateMask.fieldPaths=' + encodeURIComponent(f); }).join('&');
  var url = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/solicitudes/' + docId + '?' + updateMask;
  UrlFetchApp.fetch(url, {
    method: 'patch',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ fields: toFirestoreFields(data) }),
    muteHttpExceptions: true
  });
}

function eliminarDeFirestore(token, projectId, docId) {
  var url = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/solicitudes/' + docId;
  UrlFetchApp.fetch(url, {
    method: 'delete',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });
}

// =============================================================================
// CATALOGOS
// =============================================================================
function cargarCatalogos(token) {
  return {
    barrios: cargarCatalogoDocumento(token, 'barrios'),
    especies: cargarCatalogoDocumento(token, 'especies'),
    acciones: cargarCatalogoDocumento(token, 'acciones'),
    tecnicos: cargarColeccionPersonal(token),
    tipos_institucion: cargarCatalogoDocumento(token, 'tipos_institucion'),
    instituciones: cargarCatalogoDocumento(token, 'instituciones')
  };
}

function cargarCatalogoDocumento(token, docId) {
  var cfg = getConfig();
  var url = 'https://firestore.googleapis.com/v1/projects/' + cfg.projectId + '/databases/(default)/documents/catalogos/' + docId;
  var response = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
  var data = JSON.parse(response.getContentText());
  if (!data.fields || !data.fields.items || !data.fields.items.arrayValue || !data.fields.items.arrayValue.values) {
    return [];
  }
  
  return data.fields.items.arrayValue.values.map(function(item) {
    var fields = item.mapValue && item.mapValue.fields ? item.mapValue.fields : {};
    var obj = {};
    Object.keys(fields).forEach(function(key) {
      var valObj = fields[key];
      obj[key] = valObj.stringValue !== undefined ? valObj.stringValue : 
                (valObj.integerValue !== undefined ? parseInt(valObj.integerValue) : 
                (valObj.booleanValue !== undefined ? valObj.booleanValue : 
                (valObj.doubleValue !== undefined ? parseFloat(valObj.doubleValue) : null)));
    });
    return obj;
  });
}

function cargarColeccionPersonal(token) {
  var cfg = getConfig();
  var url = 'https://firestore.googleapis.com/v1/projects/' + cfg.projectId + '/databases/(default)/documents/personal?pageSize=300';
  var response = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
  var data = JSON.parse(response.getContentText());
  if (!data.documents) return [];
  return data.documents.map(function(doc) {
    var id = doc.name.split('/').pop();
    var fields = {};
    Object.keys(doc.fields || {}).forEach(function(key) {
      var val = doc.fields[key];
      fields[key] = val.stringValue !== undefined ? val.stringValue : 
                    (val.integerValue !== undefined ? parseInt(val.integerValue) : 
                    (val.booleanValue !== undefined ? val.booleanValue : null));
    });
    return Object.assign({ id: id }, fields);
  });
}

// =============================================================================
// RESOLUCION DE IDs (3 CAPAS)
// =============================================================================
function resolverBarrio(distritoTexto, barrioTexto, barrios) {
  if (!barrioTexto) return { id: null, advertencia: 'Barrio vacio' };
  var barrioNorm = normalizar(barrioTexto);
  var numDistrito = distritoTexto ? parseInt(distritoTexto.replace(/\D/g, '')) : null;

  // Capa 1: Nombre + Distrito exactos
  var encontrado = barrios.filter(function(b) { return normalizar(b.nombre) === barrioNorm; });
  if (numDistrito) encontrado = encontrado.filter(function(b) { return parseInt(b.id_distrito) === numDistrito; });
  if (encontrado.length > 0) return { id: encontrado[0].id, advertencia: null };

  // Capa 1b: Solo nombre
  encontrado = barrios.filter(function(b) { return normalizar(b.nombre) === barrioNorm; });
  if (encontrado.length > 0) return { id: encontrado[0].id, advertencia: 'Barrio resuelto solo por nombre (distrito no coincide): ' + barrioTexto };

  // Capa 2: Coincidencia parcial
  encontrado = barrios.filter(function(b) { var n = normalizar(b.nombre); return n.indexOf(barrioNorm) >= 0 || barrioNorm.indexOf(n) >= 0; });
  if (encontrado.length > 0) return { id: encontrado[0].id, advertencia: 'Barrio resuelto por coincidencia parcial: ' + barrioTexto };

  // Capa 3: Fallback - no resuelto
  return { id: null, advertencia: 'Barrio no resuelto: "' + barrioTexto + '" (Distrito: ' + distritoTexto + '). Guardado en barrio_texto_podar.' };
}

function resolverPorNombre(texto, catalogo, tipo) {
  if (!texto) return { id: null };
  var norm = normalizar(texto);
  var encontrado = catalogo.filter(function(item) { return normalizar(item.nombre) === norm; });
  if (encontrado.length === 0) {
    encontrado = catalogo.filter(function(item) {
      var n = normalizar(item.nombre);
      return norm.indexOf(n) >= 0 || n.indexOf(norm) >= 0;
    });
  }
  return { id: encontrado.length > 0 ? encontrado[0].id : null };
}

function resolverTecnico(nombre, tecnicos) {
  if (!nombre) return { id: null };
  
  // Limpiar el nombre (quitar Ing, Tec, Dr, Lic, etc.)
  var sheetClean = normalizar(nombre)
    .replace(/^(ing\b\.?|tec\b\.?|dr\b\.?|lic\b\.?)\s*/g, '');

  // 1. Intento exacto o substring con nombre limpio
  var encontrado = tecnicos.filter(function(t) {
    if (!t.nombre) return false;
    var dbClean = normalizar(t.nombre);
    return dbClean === sheetClean || dbClean.indexOf(sheetClean) >= 0 || sheetClean.indexOf(dbClean) >= 0;
  });

  // 2. Si no, por palabras individuales (al menos 2 palabras en común)
  if (encontrado.length === 0) {
    var sheetWords = sheetClean.split(/\s+/).filter(function(w) { return w.length > 2; });
    encontrado = tecnicos.filter(function(t) {
      if (!t.nombre) return false;
      var dbClean = normalizar(t.nombre);
      var matches = 0;
      sheetWords.forEach(function(w) {
        if (dbClean.indexOf(w) >= 0) matches++;
      });
      return matches >= 2;
    });
  }

  return { id: encontrado.length > 0 ? encontrado[0].id : null };
}

// =============================================================================
// UTILIDADES
// =============================================================================
function indexarArbolesAdicionales(datos, headers) {
  var indice = {};
  datos.slice(1).forEach(function(fila) {
    var comInt = getVal(fila, headers, 'Comunicacion interna');
    if (!comInt) return;
    var key = comInt.toString();
    if (!indice[key]) indice[key] = [];
    indice[key].push({
      id_detalle: getVal(fila, headers, 'ID_Detalle'),
      especie: getVal(fila, headers, 'especie del arbol'),
      accion: getVal(fila, headers, 'accion a realizar'),
      observacion: getVal(fila, headers, 'Observacion del tecnico'),
      realizado: getVal(fila, headers, 'realizado')
    });
  });
  return indice;
}

function getVal(fila, headers, nombre) {
  var idx = -1;
  for (var i = 0; i < headers.length; i++) {
    if (normalizar(headers[i]) === normalizar(nombre)) { idx = i; break; }
  }
  return idx >= 0 ? fila[idx] : null;
}

function normalizar(str) {
  if (!str) return '';
  var res = str.toString().trim().toLowerCase()
    .replace(/[áàäâ]/g,'a')
    .replace(/[éèëê]/g,'e')
    .replace(/[íìïî]/g,'i')
    .replace(/[óòöô]/g,'o')
    .replace(/[úùüû]/g,'u')
    .replace(/[ñ]/g,'n');
  
  // Normalizar números romanos comunes al final de los nombres
  res = res.replace(/\biv\b/g, '4')
           .replace(/\biii\b/g, '3')
           .replace(/\bii\b/g, '2')
           .replace(/\bi\b/g, '1');
  return res;
}

function mapBoolean(val) {
  if (val === true || val === false) return val;
  if (!val) return false;
  return val.toString().trim().toUpperCase() === 'SI';
}

function mapEstado(val) {
  if (!val) return 'En espera';
  if (val.toString().trim().toUpperCase() === 'TERMINADO') return 'Terminado';
  return 'En espera';
}

function mapUrgencia(val) {
  if (!val) return 'Baja';
  var v = val.toString().trim().toLowerCase();
  if (v.indexOf('alta') >= 0) return 'Alta';
  if (v.indexOf('intermedia') >= 0 || v.indexOf('media') >= 0) return 'Intermedia';
  return 'Baja';
}

function parsearGPS(gpsRaw) {
  if (!gpsRaw) return { lat: null, lng: null };
  var partes = gpsRaw.toString().trim().split(/[\s,]+/).filter(function(p) { return p !== ''; });
  if (partes.length >= 2) {
    var lat = parseFloat(partes[0]);
    var lng = parseFloat(partes[1]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat: lat, lng: lng };
  }
  return { lat: null, lng: null };
}

function convertirFechaExcel(valor) {
  if (!valor) return null;
  if (typeof valor === 'number') {
    var fecha = new Date((valor - 25569) * 86400 * 1000);
    return fecha.toISOString().split('T')[0];
  }
  return valor.toString();
}

function toFirestoreFields(obj) {
  var fields = {};
  Object.keys(obj).forEach(function(key) {
    var val = obj[key];
    if (val === null || val === undefined) {
      fields[key] = { nullValue: null };
    } else if (val instanceof Date) {
      fields[key] = { timestampValue: val.toISOString() };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (typeof val === 'number') {
      fields[key] = { doubleValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = { arrayValue: { values: val.map(function(item) { return { mapValue: { fields: toFirestoreFields(item) } }; }) } };
    } else {
      fields[key] = { stringValue: val.toString() };
    }
  });
  return fields;
}

// =============================================================================
// LOG
// =============================================================================
function guardarLog(log) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaLog = ss.getSheetByName('SyncLog');
    if (!hojaLog) {
      hojaLog = ss.insertSheet('SyncLog');
      hojaLog.appendRow(['Fecha', 'Sincronizados', 'Advertencias', 'Errores', 'Duracion (ms)', 'Detalle']);
    }
    hojaLog.appendRow([log.fecha, log.resumen.total_sincronizados, log.resumen.total_advertencias, log.resumen.total_errores, log.resumen.duracion_ms, JSON.stringify({ advertencias: log.advertencias.slice(0,10), errores: log.errores.slice(0,10) })]);
  } catch(e) {
    Logger.log('No se pudo guardar el log: ' + e.message);
  }
}










// =============================================================================
// FUNCIÓN DE DIAGNÓSTICO
// =============================================================================
function detectarDuplicadosYErrores() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaBase = ss.getSheetByName('basededatos');
  if (!hojaBase) {
    Logger.log('Error: No se encontró la hoja "basededatos".');
    return;
  }
  
  var datos = hojaBase.getDataRange().getValues();
  var headers = datos[0];
  
  var idxCom = -1;
  var idxEstado = -1;
  for (var i = 0; i < headers.length; i++) {
    if (normalizar(headers[i]) === normalizar('Comunicacion interna')) idxCom = i;
    if (normalizar(headers[i]) === normalizar('Estado')) idxEstado = i;
  }
  
  if (idxCom === -1 || idxEstado === -1) {
    Logger.log('Error: No se encontraron las columnas necesarias.');
    return;
  }
  
  var mapaCom = {};
  var duplicados = [];
  var inactivos = [];
  var vacios = [];
  
  for (var r = 1; r < datos.length; r++) {
    var fila = r + 1;
    var comInt = datos[r][idxCom] ? datos[r][idxCom].toString().trim() : '';
    var estado = datos[r][idxEstado] ? datos[r][idxEstado].toString().trim().toUpperCase() : '';
    
    if (!comInt) {
      vacios.push({ fila: fila, motivo: 'Comunicación interna vacía' });
      continue;
    }
    
    // Verificar si el estado es válido
    if (estado !== 'EN ESPERA' && estado !== 'TERMINADO') {
      inactivos.push({ fila: fila, codigo: comInt, estado: estado });
      continue;
    }
    
    // Verificar duplicados
    if (mapaCom[comInt]) {
      duplicados.push({
        codigo: comInt,
        filaOriginal: mapaCom[comInt],
        filaDuplicada: fila
      });
    } else {
      mapaCom[comInt] = fila;
    }
  }
  
  Logger.log('\n=== ⚠️ DUPLICADOS ENCONTRADOS (Se sobreescriben en Firestore) ===');
  Logger.log('Total duplicados: ' + duplicados.length);
  duplicados.forEach(function(d) {
    Logger.log('Código "' + d.codigo + '" repetido en Fila ' + d.filaDuplicada + ' (Original en Fila ' + d.filaOriginal + ')');
  });
  
  Logger.log('\n=== 🚫 FILAS IGNORADAS POR ESTADO NO VÁLIDO (No se suben) ===');
  Logger.log('Total ignorados: ' + inactivos.length);
  inactivos.forEach(function(i) {
    Logger.log('Fila ' + i.fila + ' | Código: "' + i.codigo + '" | Estado: "' + i.estado + '" (Debe ser EN ESPERA o TERMINADO)');
  });
  
  Logger.log('\n=== 📭 FILAS VACÍAS (Saltadas) ===');
  Logger.log('Total vacías: ' + vacios.length);
  
  Logger.log('\n📊 Conclusión:');
  Logger.log('- Filas totales de datos: ' + (datos.length - 1));
  Logger.log('- Filas con datos válidos para subir: ' + Object.keys(mapaCom).length);
}

// =============================================================================
// RECEPTOR DE ACTUALIZACIONES (ARBORGEST -> GOOGLE SHEETS)
// =============================================================================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var comInt = data.comunicacion_interna;
    if (!comInt) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Falta comunicacion_interna' }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    var result;
    if (data.action === 'delete') {
      result = eliminarFilaEnHoja(comInt);
    } else if (data.action === 'create') {
      result = crearFilaEnHoja(comInt, data);
    } else {
      result = actualizarFilaEnHoja(comInt, data);
    }
    return ContentService.createTextOutput(JSON.stringify(result))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function eliminarFilaEnHoja(comInt) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('basededatos');
  if (!sheet) {
    return { success: false, error: 'Hoja "basededatos" no encontrada' };
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { success: false, error: 'Hoja vacía' };
  }
  
  // Buscar columna 'Comunicacion interna'
  var rangeHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  var headers = rangeHeaders.getValues()[0];
  var colComIntIdx = headers.indexOf('Comunicacion interna');
  if (colComIntIdx === -1) {
    return { success: false, error: 'Columna "Comunicacion interna" no encontrada' };
  }
  
  var codes = sheet.getRange(2, colComIntIdx + 1, lastRow - 1, 1).getValues();
  var rowIndex = -1;
  for (var i = 0; i < codes.length; i++) {
    if (codes[i][0].toString().trim() === comInt.toString().trim()) {
      rowIndex = i + 2; // +2 porque el array es 0-indexed y empieza en la fila 2
      break;
    }
  }
  
  if (rowIndex === -1) {
    return { success: false, error: 'No se encontró la fila con Comunicación Interna: ' + comInt };
  }
  
  // Eliminar la fila en basededatos
  sheet.deleteRow(rowIndex);
  
  // También eliminar árboles correspondientes en la hoja de detalle
  var sheetDetalle = ss.getSheetByName('DetalleDeArboles');
  if (!sheetDetalle) sheetDetalle = ss.getSheetByName('DetalleDeÁrboles');
  var deletedTreesCount = 0;
  if (sheetDetalle) {
    var lastRowDet = sheetDetalle.getLastRow();
    if (lastRowDet >= 2) {
      var rangeHeadersDet = sheetDetalle.getRange(1, 1, 1, sheetDetalle.getLastColumn());
      var headersDet = rangeHeadersDet.getValues()[0];
      var colComIntIdxDet = headersDet.indexOf('Comunicacion interna');
      if (colComIntIdxDet !== -1) {
        var codesDet = sheetDetalle.getRange(2, colComIntIdxDet + 1, lastRowDet - 1, 1).getValues();
        // Borrar de abajo hacia arriba para evitar problemas con los índices de fila que cambian al borrar
        for (var j = codesDet.length - 1; j >= 0; j--) {
          if (codesDet[j][0].toString().trim() === comInt.toString().trim()) {
            sheetDetalle.deleteRow(j + 2);
            deletedTreesCount++;
          }
        }
      }
    }
  }
  
  return { success: true, row: rowIndex, message: 'Fila eliminada con éxito de basededatos y ' + deletedTreesCount + ' árboles eliminados de la hoja de detalles.' };
}

function crearFilaEnHoja(comInt, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('basededatos');
  if (!sheet) {
    return { success: false, error: 'Hoja "basededatos" no encontrada' };
  }
  
  var rangeHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  var headers = rangeHeaders.getValues()[0];
  
  // Agregar una fila vacía al final
  sheet.appendRow([]);
  var rowIndex = sheet.getLastRow();
  
  function setCell(colName, val) {
    var colIdx = headers.indexOf(colName);
    if (colIdx !== -1 && val !== undefined && val !== null) {
      sheet.getRange(rowIndex, colIdx + 1).setValue(val);
    }
  }
  
  // Rellenar campos de la nueva fila
  setCell('Comunicacion interna', comInt);
  setCell('Estado', (data.estado_tramite && data.estado_tramite.toString().trim().toUpperCase() === 'TERMINADO') ? 'TERMINADO' : 'EN ESPERA');
  setCell('Distrito', data.distrito_nombre || '');
  setCell('Barrio', data.barrio_nombre || '');
  setCell('Calles', data.calle || '');
  setCell('N de Casa', data.numero_casa || '');
  setCell('N° de Casa', data.numero_casa || '');
  setCell('Referencias', data.referencia || '');
  setCell('Solicitante', data.solicitante_nombre || '');
  setCell('Telefono', data.solicitante_telefono || '');
  
  var gpsVal = '';
  if (data.lat && data.lng) {
    gpsVal = data.lat + ', ' + data.lng;
  }
  setCell('Ubicacion gps', gpsVal);
  
  setCell('Fecha de Ingreso', data.fecha_ingreso || '');
  setCell('Fecha de Ejecucion', data.fecha_ejecucion || '');
  setCell('Verificado', data.verificado ? 'SI' : 'NO');
  setCell('Requiere Plataforma', data.requiere_plataforma ? 'SI' : 'NO');
  setCell('Requiere Setar', data.requiere_setar ? 'SI' : 'NO');
  setCell('Requiere Ficha Tecnica', data.requiere_ficha_tecnica ? 'SI' : 'NO');
  setCell('Procede', data.procede ? 'SI' : 'NO');
  setCell('Urgencia', data.nivel_urgencia ? data.nivel_urgencia.toString().toUpperCase() : 'BAJA');
  setCell('Observacion de Verificacion', data.observacion_verificacion || '');
  setCell('Observacion de Ejecucion', data.observaciones_finales || '');
  setCell('Tecnico de Verificacion', data.tecnico_verificacion_nombre || '');
  setCell('Tecnico de Ejecucion', data.tecnico_ejecucion_nombre || '');
  setCell('Institucion', data.tipo_institucion_nombre || '');
  setCell('Lista instituciones', data.institucion_nombre || '');
  setCell('USUARIO', data.usuario_podar || 'ArborGest');
  
  // Árbol Principal (en basededatos)
  if (data.arboles && data.arboles.length > 0) {
    var a = data.arboles[0];
    setCell('Especie de Arbol', a.especie || '');
    setCell('Accion a Realizar', a.accion || '');
    setCell('Lo Solicitado', a.especie ? 'Poda' : ''); 
    setCell('Observacion de Verificacion', a.observacion || data.observacion_verificacion || '');
  }
  
  // Árboles Adicionales (en DetalleDeArboles)
  var sheetDetalle = ss.getSheetByName('DetalleDeArboles');
  if (!sheetDetalle) sheetDetalle = ss.getSheetByName('DetalleDeÁrboles');
  var addedTreesCount = 0;
  if (sheetDetalle && data.arboles && data.arboles.length > 1) {
    var rangeHeadersDet = sheetDetalle.getRange(1, 1, 1, sheetDetalle.getLastColumn());
    var headersDet = rangeHeadersDet.getValues()[0];
    
    for (var i = 1; i < data.arboles.length; i++) {
      var arb = data.arboles[i];
      sheetDetalle.appendRow([]);
      var rowDetIdx = sheetDetalle.getLastRow();
      
      function setCellDet(colName, val) {
        var colIdx = headersDet.indexOf(colName);
        if (colIdx !== -1 && val !== undefined && val !== null) {
          sheetDetalle.getRange(rowDetIdx, colIdx + 1).setValue(val);
        }
      }
      
      var idDetalle = 'det_' + comInt.replace(/\//g, '-') + '_' + i;
      
      setCellDet('ID_Detalle', idDetalle);
      setCellDet('Comunicacion interna', comInt);
      setCellDet('especie del arbol', arb.especie || '');
      setCellDet('accion a realizar', arb.accion || '');
      setCellDet('Observacion del tecnico', arb.observacion || '');
      setCellDet('realizado', arb.realizado ? 'SI' : 'NO');
      addedTreesCount++;
    }
  }
  
  return { success: true, row: rowIndex, message: 'Fila creada con éxito en basededatos y ' + addedTreesCount + ' árboles registrados en la hoja de detalles.' };
}

function actualizarFilaEnHoja(comInt, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('basededatos');
  if (!sheet) {
    return { success: false, error: 'Hoja "basededatos" no encontrada' };
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { success: false, error: 'Hoja vacía' };
  }
  
  // Buscar columna 'Comunicacion interna'
  var rangeHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  var headers = rangeHeaders.getValues()[0];
  var colComIntIdx = headers.indexOf('Comunicacion interna');
  if (colComIntIdx === -1) {
    return { success: false, error: 'Columna "Comunicacion interna" no encontrada' };
  }
  
  var codes = sheet.getRange(2, colComIntIdx + 1, lastRow - 1, 1).getValues();
  var rowIndex = -1;
  for (var i = 0; i < codes.length; i++) {
    if (codes[i][0].toString().trim() === comInt.toString().trim()) {
      rowIndex = i + 2; // +2 porque el array es 0-indexed y empieza en la fila 2
      break;
    }
  }
  
  if (rowIndex === -1) {
    return { success: false, error: 'No se encontró la fila con Comunicación Interna: ' + comInt };
  }
  
  // Mapear campos recibidos a columnas
  var updatesCount = 0;
  
  function updateCell(colName, val) {
    var colIdx = headers.indexOf(colName);
    if (colIdx !== -1) {
      sheet.getRange(rowIndex, colIdx + 1).setValue(val);
      updatesCount++;
    }
  }
  
  // 1. Estado
  if (data.estado_tramite !== undefined) {
    var estVal = (data.estado_tramite && data.estado_tramite.toString().trim().toUpperCase() === 'TERMINADO') ? 'TERMINADO' : 'EN ESPERA';
    updateCell('Estado', estVal);
  }
  
  // 2. Toggles Booleans
  if (data.verificado !== undefined) updateCell('Verificado', data.verificado ? 'SI' : 'NO');
  if (data.requiere_plataforma !== undefined) updateCell('Requiere Plataforma', data.requiere_plataforma ? 'SI' : 'NO');
  if (data.requiere_setar !== undefined) updateCell('Requiere Setar', data.requiere_setar ? 'SI' : 'NO');
  if (data.requiere_ficha_tecnica !== undefined) updateCell('Requiere Ficha Tecnica', data.requiere_ficha_tecnica ? 'SI' : 'NO');
  if (data.procede !== undefined) updateCell('Procede', data.procede ? 'SI' : 'NO');
  
  // 3. Prioridad
  if (data.nivel_urgencia !== undefined) {
    var urgVal = data.nivel_urgencia.toString().toUpperCase();
    updateCell('Urgencia', urgVal);
  }
  
  // 4. Fechas y Observaciones
  if (data.fecha_ejecucion !== undefined) updateCell('Fecha de Ejecucion', data.fecha_ejecucion);
  if (data.observaciones_finales !== undefined) updateCell('Observacion de Ejecucion', data.observaciones_finales);
  if (data.observacion_verificacion !== undefined) updateCell('Observacion de Verificacion', data.observacion_verificacion);
  
  // 5. Nombres Técnicos
  if (data.tecnico_ejecucion_nombre !== undefined) updateCell('Tecnico de Ejecucion', data.tecnico_ejecucion_nombre);
  if (data.tecnico_verificacion_nombre !== undefined) updateCell('Tecnico de Verificacion', data.tecnico_verificacion_nombre);
  
  // 6. Árbol Principal
  if (data.arbol_especie_nombre !== undefined && data.arbol_especie_nombre !== '') updateCell('Especie de Arbol', data.arbol_especie_nombre);
  if (data.arbol_accion_realizar_nombre !== undefined && data.arbol_accion_realizar_nombre !== '') updateCell('Accion a Realizar', data.arbol_accion_realizar_nombre);
  if (data.arbol_accion_solicitada_nombre !== undefined && data.arbol_accion_solicitada_nombre !== '') updateCell('Lo Solicitado', data.arbol_accion_solicitada_nombre);
  if (data.arbol_observaciones !== undefined) updateCell('Observacion de Verificacion', data.arbol_observaciones);
  
  return { success: true, row: rowIndex, updates: updatesCount };
}

// =============================================================================
// SISTEMA DE RESPALDO AUTOMÁTICO DE PLANILLA EN GOOGLE DRIVE
// =============================================================================
function respaldarPlanilla() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var folderName = "Respaldos PodarApp";
    
    // Buscar o crear la carpeta de respaldos en Google Drive
    var folders = DriveApp.getFoldersByName(folderName);
    var folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    
    // Generar el nombre del archivo de copia con marca temporal
    var fechaStr = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "yyyy-MM-dd_HH-mm");
    var backupName = ss.getName() + " - RESPALDO - " + fechaStr;
    
    // Crear la copia en la carpeta de respaldos
    var file = DriveApp.getFileById(ss.getId());
    file.makeCopy(backupName, folder);
    Logger.log("✅ Respaldado con éxito: " + backupName + " en carpeta '" + folderName + "'");
    
    // Limpieza de respaldos viejos (mantener solo los últimos 10)
    var files = folder.getFiles();
    var fileList = [];
    while (files.hasNext()) {
      var f = files.next();
      fileList.push({
        id: f.getId(),
        dateCreated: f.getDateCreated(),
        name: f.getName()
      });
    }
    
    // Ordenar de más antiguos a más nuevos
    fileList.sort(function(a, b) {
      return a.dateCreated - b.dateCreated;
    });
    
    // Si hay más de 10, borrar los más antiguos
    var MAX_BACKUPS = 10;
    if (fileList.length > MAX_BACKUPS) {
      var filesToDelete = fileList.slice(0, fileList.length - MAX_BACKUPS);
      for (var i = 0; i < filesToDelete.length; i++) {
        DriveApp.getFileById(filesToDelete[i].id).setTrashed(true);
        Logger.log("🗑️ Eliminado respaldo antiguo: " + filesToDelete[i].name);
      }
    }
    
  } catch (e) {
    Logger.log("❌ Error al crear el respaldo: " + e.message);
  }
}

// =============================================================================
// FUNCIÓN TEMPORAL PARA REGISTRAR EVALUADORES EN FIRESTORE
// =============================================================================
function agregarEvaluadoresFirestore() {
  var token = getFirestoreToken();
  var cfg = getConfig();
  
  var evaluadores = [
    { id: "30", nombre: "Karina Castro", role: "TECNICO", cargo: "Técnico Evaluador", estado: "Activo", username: null },
    { id: "31", nombre: "Cimar Farfan", role: "TECNICO", cargo: "Técnico Evaluador", estado: "Activo", username: null }
  ];
  
  evaluadores.forEach(function(ev) {
    var url = 'https://firestore.googleapis.com/v1/projects/' + cfg.projectId + '/databases/(default)/documents/personal/' + ev.id;
    
    var payload = {
      fields: {
        id: { stringValue: ev.id },
        nombre: { stringValue: ev.nombre },
        role: { stringValue: ev.role },
        cargo: { stringValue: ev.cargo },
        estado: { stringValue: ev.estado },
        username: { nullValue: null }
      }
    };
    
    var options = {
      method: 'patch',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + token },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    Logger.log("Resultado para " + ev.nombre + ": " + response.getContentText());
  });
}

function verDocumento43() {
  var token = getFirestoreToken();
  var cfg = getConfig();
  var url = 'https://firestore.googleapis.com/v1/projects/' + cfg.projectId + '/databases/(default)/documents/solicitudes/podar_43-25';
  var response = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
  Logger.log(response.getContentText());
}

