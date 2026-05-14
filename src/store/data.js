import { reactive } from 'vue';

// URL del backend (Configurable para producción o proxy local)
const API_URL = import.meta.env.VITE_API_URL || '/api';
console.log("DEBUG: La URL de la API es:", API_URL);

// Estado global para los catálogos y solicitudes
export const store = reactive({
  tecnicos: [],
  acciones: [],
  especies: [],
  tipos_institucion: [],
  instituciones: [],
  distritos: [],
  barrios: [],
  solicitudes: [],
  usuarios: [],
  impresiones: [],
  config: {}
});

export const uiState = reactive({
  showModal: false,
  editData: null,
  theme: 'colors',
  user: JSON.parse(localStorage.getItem('user')) || null,
  loginTime: localStorage.getItem('loginTime') || null,
  logo_app: localStorage.getItem('logo_app') || null,
  logo_institucional: localStorage.getItem('logo_institucional') || null
});

// --- Sistema de Notificaciones (Toast) ---
export const toast = reactive({
  visible: false,
  message: '',
  type: 'success'   // 'success' | 'error'
});

let _toastTimer = null;
export function showToast(message, type = 'success', durationMs = 3500) {
  if (_toastTimer) clearTimeout(_toastTimer);
  toast.message = message;
  toast.type = type;
  toast.visible = true;
  _toastTimer = setTimeout(() => { toast.visible = false; }, durationMs);
}

// --- Sistema de Autenticación ---
export async function login(username, password) {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success) {
      uiState.user = data.user;
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      uiState.loginTime = now;
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('loginTime', now);
      localStorage.setItem('loginTimeFull', new Date().toISOString());
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error en login:', error);
    return false;
  }
}

export function logout() {
  uiState.user = null;
  uiState.loginTime = null;
  localStorage.removeItem('user');
  localStorage.removeItem('loginTime');
}


// Función para descargar los catálogos de MySQL
export async function fetchCatalogos() {
  try {
    const response = await fetch(`${API_URL}/catalogos`);
    const data = await response.json();
    
    // Poblar el store con los catálogos principales
    store.tecnicos = data.tecnicos || [];
    store.acciones = data.acciones || [];
    store.especies = data.especies || [];
    store.tipos_institucion = data.tipos_institucion || [];
    store.instituciones = data.instituciones || [];
    store.distritos = data.distritos || [];
    store.barrios = data.barrios || [];
    
    // Descargar datos complementarios en PARALELO para no bloquear el inicio
    Promise.allSettled([
        fetchUsuarios(),
        fetchImpresiones(),
        fetchConfig()
    ]).then(() => {
        console.log("Carga de datos secundarios completada.");
    });
    
    console.log("Catálogos base cargados desde MySQL.");
  } catch (error) {
    console.error("Error al cargar los catálogos:", error);
  }
}

// --- CONFIGURACIÓN DEL SISTEMA ---
export async function fetchConfig() {
  try {
    const response = await fetch(`${API_URL}/config`);
    store.config = await response.json();
  } catch (error) {
    console.error("Error al cargar configuración:", error);
  }
}

export async function updateConfig(datos) {
  try {
    const response = await fetch(`${API_URL}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (response.ok) {
      await fetchConfig();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    return false;
  }
}

// Función para descargar historial de impresiones
export async function fetchImpresiones() {
  try {
    const response = await fetch(`${API_URL}/impresiones`);
    store.impresiones = await response.json();
  } catch (error) {
    console.error("Error al cargar impresiones:", error);
  }
}

// Función para registrar una impresión (Individual o Hoja de Ruta)
export async function registrarImpresion(datos) {
  // datos: { nombre_reporte, id_solicitud, tipo_reporte, filtros_aplicados, detalles }
  try {
    const response = await fetch(`${API_URL}/impresiones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...datos,
        usuario: uiState.user?.nombre || 'Desconocido'
      })
    });
    if (response.ok) {
      await fetchImpresiones();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error al registrar impresión:", error);
    return false;
  }
}

export async function deleteImpresion(id) {
  try {
    const response = await fetch(`${API_URL}/impresiones/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      await fetchImpresiones();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error al eliminar impresión:", error);
    return false;
  }
}

export async function updateImpresionName(id, nuevoNombre) {
  try {
    const response = await fetch(`${API_URL}/impresiones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre_reporte: nuevoNombre })
    });
    if (response.ok) {
      await fetchImpresiones();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error al actualizar nombre:", error);
    return false;
  }
}

// Función para descargar los usuarios públicos (para el login)
export async function fetchPublicUsuarios() {
  try {
    const response = await fetch(`${API_URL}/usuarios/publico`);


    return await response.json();
  } catch (error) {
    console.error("Error al cargar usuarios públicos:", error);
    return [];
  }
}

// Función para descargar los usuarios de MySQL
export async function fetchUsuarios() {

  try {
    const response = await fetch(`${API_URL}/usuarios`);
    store.usuarios = await response.json();
    console.log("Usuarios cargados desde MySQL con éxito.");
  } catch (error) {
    console.error("Error al cargar los usuarios:", error);
  }
}

// Función para guardar un nuevo usuario
export async function addUsuario(usuario) {
  try {
    const response = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Role': uiState.user?.role
      },
      body: JSON.stringify(usuario)
    });
    if (response.ok) {
      await fetchUsuarios();
      return true;
    }
    const err = await response.json();
    return err.error || 'Error en el servidor';
  } catch (error) {
    console.error('Error al agregar usuario:', error);
    return false;
  }
}

// Función para eliminar un usuario
export async function deleteUsuario(id) {
  try {
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
      method: 'DELETE',
      headers: { 'X-User-Role': uiState.user?.role }
    });
    if (response.ok) {
      store.usuarios = store.usuarios.filter(u => u.id != id);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return false;
  }
}

// Función para actualizar un usuario
export async function updateUsuario(id, usuario) {
  try {
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Role': uiState.user?.role
      },
      body: JSON.stringify(usuario)
    });
    if (response.ok) {
      await fetchUsuarios();
      return true;
    }
    const err = await response.json();
    return err.error || 'Error en el servidor';
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return false;
  }
}

// Función para descargar las solicitudes de MySQL
export async function fetchSolicitudes() {
  try {
    const response = await fetch(`${API_URL}/solicitudes`);
    store.solicitudes = await response.json();
    console.log("Solicitudes cargadas desde MySQL con éxito.");
  } catch (error) {
    console.error("Error al cargar las solicitudes:", error);
  }
}

// Función para guardar una nueva solicitud en MySQL
export async function addSolicitud(solicitud) {
  try {
    const response = await fetch(`${API_URL}/solicitudes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(solicitud)
    });
    
    const data = await response.json();
    if (response.ok) {
      solicitud.id_solicitud = data.id_solicitud;
      store.solicitudes.unshift(solicitud); // Usar unshift para que aparezca arriba
      return { success: true };
    } else {
      return { success: false, error: data.error || 'Error desconocido en el servidor' };
    }
  } catch (error) {
    return { success: false, error: 'Error de conexión: El servidor no responde' };
  }
}

// Función para ELIMINAR una solicitud de MySQL
export async function deleteSolicitud(id) {
  try {
    const response = await fetch(`${API_URL}/solicitudes/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      store.solicitudes = store.solicitudes.filter(s => s.id_solicitud != id);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al eliminar:', error);
    return false;
  }
}

// Función para actualizar una solicitud en MySQL
export async function updateSolicitud(id, datos) {
  try {
    const response = await fetch(`${API_URL}/solicitudes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    
    const data = await response.json();
    if (response.ok) {
      const idx = store.solicitudes.findIndex(s => s.id_solicitud == id);
      if (idx !== -1) store.solicitudes[idx] = { ...store.solicitudes[idx], ...datos, id_solicitud: id };
      return { success: true };
    } else {
      return { success: false, error: data.error || 'Error al actualizar' };
    }
  } catch (error) {
    return { success: false, error: 'Error de conexión al actualizar' };
  }
}
// --- GESTIÓN DE CATÁLOGOS (DINÁMICO) ---
export async function addCatalogo(tabla, datos) {
  try {
    const response = await fetch(`${API_URL}/catalogos/${tabla}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (response.ok) {
      await fetchCatalogos(); // Recargar todo para sincronizar
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error al agregar en ${tabla}:`, error);
    return false;
  }
}

export async function updateCatalogo(tabla, id, datos) {
  try {
    const response = await fetch(`${API_URL}/catalogos/${tabla}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (response.ok) {
      await fetchCatalogos();
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error al actualizar en ${tabla}:`, error);
    return false;
  }
}

export async function deleteCatalogo(tabla, id) {
  try {
    const response = await fetch(`${API_URL}/catalogos/${tabla}/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      await fetchCatalogos();
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error al eliminar de ${tabla}:`, error);
    return false;
  }
}
