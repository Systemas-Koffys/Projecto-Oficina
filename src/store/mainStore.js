import { defineStore, setActivePinia } from 'pinia';
import { reactive } from 'vue';
import { pinia } from './pinia.js';

setActivePinia(pinia);

const API_URL = import.meta.env.VITE_API_URL || '/api';
console.log("DEBUG: La URL de la API es (Pinia Store):", API_URL);

export const useMainStore = defineStore('mainStore', () => {
  // Estado global para los catálogos y solicitudes
  const store = reactive({
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

  const uiState = reactive({
    showModal: false,
    editData: null,
    theme: 'colors',
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    loginTime: localStorage.getItem('loginTime') || null,
    logo_app: localStorage.getItem('logo_app') || null,
    logo_institucional: localStorage.getItem('logo_institucional') || null,
    isLoading: false
  });

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (uiState.token) headers['Authorization'] = `Bearer ${uiState.token}`;
    if (uiState.user?.role) headers['X-User-Role'] = uiState.user.role;
    return headers;
  };

  // --- Sistema de Notificaciones (Toast) ---
  const toast = reactive({
    visible: false,
    message: '',
    type: 'success'   // 'success' | 'error'
  });

  let _toastTimer = null;
  function showToast(message, type = 'success', durationMs = 3500) {
    if (_toastTimer) clearTimeout(_toastTimer);
    toast.message = message;
    toast.type = type;
    toast.visible = true;
    _toastTimer = setTimeout(() => { toast.visible = false; }, durationMs);
  }

  // --- Sistema de Autenticación ---
  async function login(username, password) {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (data.success) {
        uiState.user = data.user;
        uiState.token = data.token;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        uiState.loginTime = now;
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
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

  function logout() {
    uiState.user = null;
    uiState.token = null;
    uiState.loginTime = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('loginTime');
  }

  // Función para descargar los catálogos de MySQL
  async function fetchCatalogos() {
    uiState.isLoading = true;
    try {
      const response = await fetch(`${API_URL}/catalogos`, { headers: getAuthHeaders() });
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
          fetchConfig(),
          fetchSolicitudes()
      ]).then(() => {
          console.log("Carga de datos secundarios completada.");
          uiState.isLoading = false;
      });
      
      console.log("Catálogos base cargados desde MySQL.");
    } catch (error) {
      console.error("Error al cargar los catálogos:", error);
      uiState.isLoading = false;
    }
  }

  // --- CONFIGURACIÓN DEL SISTEMA ---
  async function fetchConfig() {
    try {
      const response = await fetch(`${API_URL}/config`, { headers: getAuthHeaders() });
      store.config = await response.json();
    } catch (error) {
      console.error("Error al cargar configuración:", error);
    }
  }

  async function updateConfig(datos) {
    try {
      const response = await fetch(`${API_URL}/config`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
  async function fetchImpresiones() {
    try {
      const response = await fetch(`${API_URL}/impresiones`, { headers: getAuthHeaders() });
      store.impresiones = await response.json();
    } catch (error) {
      console.error("Error al cargar impresiones:", error);
    }
  }

  // Función para registrar una impresión (Individual o Hoja de Ruta)
  async function registrarImpresion(datos) {
    try {
      const response = await fetch(`${API_URL}/impresiones`, {
        method: 'POST',
        headers: getAuthHeaders(),
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

  async function deleteImpresion(id) {
    try {
      const response = await fetch(`${API_URL}/impresiones/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
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

  async function updateImpresionName(id, nuevoNombre) {
    try {
      const response = await fetch(`${API_URL}/impresiones/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
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
  async function fetchPublicUsuarios() {
    try {
      const response = await fetch(`${API_URL}/usuarios/publico`);
      return await response.json();
    } catch (error) {
      console.error("Error al cargar usuarios públicos:", error);
      return [];
    }
  }

  // Función para descargar los usuarios de MySQL
  async function fetchUsuarios() {
    try {
      const response = await fetch(`${API_URL}/usuarios`, { headers: getAuthHeaders() });
      store.usuarios = await response.json();
      console.log("Usuarios cargados desde MySQL con éxito.");
    } catch (error) {
      console.error("Error al cargar los usuarios:", error);
    }
  }

  // Función para guardar un nuevo usuario
  async function addUsuario(usuario) {
    try {
      const response = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: getAuthHeaders(),
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

  // --- ELIMINAR un usuario ---
  async function deleteUsuario(id) {
    try {
      const response = await fetch(`${API_URL}/usuarios/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
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

  // --- ACTUALIZAR un usuario ---
  async function updateUsuario(id, usuario) {
    try {
      const response = await fetch(`${API_URL}/usuarios/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
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
  async function fetchSolicitudes() {
    try {
      const response = await fetch(`${API_URL}/solicitudes`, { headers: getAuthHeaders() });
      store.solicitudes = await response.json();
      console.log("Solicitudes cargadas desde MySQL con éxito.");
    } catch (error) {
      console.error("Error al cargar las solicitudes:", error);
    }
  }

  // Función para guardar una nueva solicitud en MySQL
  async function addSolicitud(solicitud) {
    try {
      const response = await fetch(`${API_URL}/solicitudes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(solicitud)
      });
      
      const data = await response.json();
      if (response.ok) {
        solicitud.id_solicitud = data.id_solicitud;
        store.solicitudes.unshift(solicitud);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Error desconocido en el servidor' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión: El servidor no responde' };
    }
  }

  // Función para ELIMINAR una solicitud de MySQL
  async function deleteSolicitud(id) {
    try {
      const response = await fetch(`${API_URL}/solicitudes/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
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
  async function updateSolicitud(id, datos) {
    try {
      const response = await fetch(`${API_URL}/solicitudes/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
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
  async function addCatalogo(tabla, datos) {
    try {
      const response = await fetch(`${API_URL}/catalogos/${tabla}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(datos)
      });
      if (response.ok) {
        await fetchCatalogos();
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error al agregar en ${tabla}:`, error);
      return false;
    }
  }

  async function updateCatalogo(tabla, id, datos) {
    try {
      const response = await fetch(`${API_URL}/catalogos/${tabla}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
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

  async function deleteCatalogo(tabla, id) {
    try {
      const response = await fetch(`${API_URL}/catalogos/${tabla}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
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

  // --- CALENDARIO FESTIVO ---
  async function fetchCalendario() {
    try {
      const response = await fetch(`${API_URL}/calendario`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      console.error('Error al cargar calendario:', error);
      return [];
    }
  }

  async function addCalendarioEvento(evento) {
    try {
      const response = await fetch(`${API_URL}/calendario`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(evento)
      });
      return response.ok;
    } catch (error) {
      console.error('Error al agregar evento:', error);
      return false;
    }
  }

  async function updateCalendarioEvento(id, evento) {
    try {
      const response = await fetch(`${API_URL}/calendario/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(evento)
      });
      return response.ok;
    } catch (error) {
      console.error('Error al actualizar evento:', error);
      return false;
    }
  }

  async function deleteCalendarioEvento(id) {
    try {
      const response = await fetch(`${API_URL}/calendario/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      return response.ok;
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      return false;
    }
  }

  return {
    store,
    uiState,
    toast,
    getAuthHeaders,
    showToast,
    login,
    logout,
    fetchCatalogos,
    fetchConfig,
    updateConfig,
    fetchImpresiones,
    registrarImpresion,
    deleteImpresion,
    updateImpresionName,
    fetchPublicUsuarios,
    fetchUsuarios,
    addUsuario,
    deleteUsuario,
    updateUsuario,
    fetchSolicitudes,
    addSolicitud,
    deleteSolicitud,
    updateSolicitud,
    addCatalogo,
    updateCatalogo,
    deleteCatalogo,
    fetchCalendario,
    addCalendarioEvento,
    updateCalendarioEvento,
    deleteCalendarioEvento
  };
});
