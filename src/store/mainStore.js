import { defineStore, setActivePinia } from 'pinia';
import { reactive, computed } from 'vue';
import { pinia } from './pinia.js';
import { auth, db, firebaseConfig } from '../firebase/config.js';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updatePassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { 
  doc, 
  collection, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  runTransaction,
  serverTimestamp 
} from 'firebase/firestore';
// Firebase Storage ya no se usa - las imágenes se suben a Cloudinary
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth as getSecondaryAuth, createUserWithEmailAndPassword } from 'firebase/auth';

setActivePinia(pinia);

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
    auditoria: [],
    config: {},
    inventarioItems: [],
    inventarioActivos: [],
    inventarioConsumibles: [],
    inventarioMovimientos: []
  });

  const responsableArea = computed(() => {
    const p = store.tecnicos.find(t => t.cargo === 'Responsable de Área');
    if (!p) return 'Ing. Cimar Farfan';
    return p.nombre.startsWith('Ing.') || p.nombre.startsWith('Lic.') ? p.nombre : `Ing. ${p.nombre}`;
  });

  const jefeUnidad = computed(() => {
    const p = store.tecnicos.find(t => t.cargo === 'Jefe de Unidad');
    if (!p) return 'Ing. Raul Arteaga';
    return p.nombre.startsWith('Ing.') || p.nombre.startsWith('Lic.') ? p.nombre : `Ing. ${p.nombre}`;
  });

  const uiState = reactive({
    showModal: false,
    editData: null,
    theme: 'colors',
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    loginTime: sessionStorage.getItem('loginTime') || null,
    logo_app: localStorage.getItem('logo_app') || null,
    logo_institucional: localStorage.getItem('logo_institucional') || null,
    isLoading: false,
    isSidebarCollapsed: localStorage.getItem('sidebar_collapsed') === 'true'
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

  // --- Helper para comprimir una imagen Base64 usando Canvas ---
  function compressImage(base64Data, maxWidth = 800, maxHeight = 800, quality = 0.7) {
    return new Promise((resolve) => {
      if (!base64Data || !base64Data.startsWith('data:image')) {
        return resolve(base64Data);
      }
      const img = new Image();
      img.src = base64Data;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        // Rellenar con fondo blanco para que la transparencia de PNGs
        // no se convierta en negro al exportar como JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => {
        resolve(base64Data); // Fallback: retornar original si hay error
      };
    });
  }

  // --- Helper para subir imágenes a Cloudinary (CDN gratuito) ---
  // Usa un upload preset "Unsigned" que no requiere API Key ni CORS especial.
  // Si Cloudinary falla por alguna razón, cae al fallback de Base64 comprimido en Firestore.
  // Cloud: dlabhoodm | Preset: sistema-gamt-uploads
  async function uploadImage(base64Data, folder = 'images') {
    if (!base64Data || !base64Data.startsWith('data:image')) {
      return base64Data; // Ya es una URL pública, retornarla tal cual
    }
    
    try {
      // Comprimir antes de subir: máx 1200x1200px al 82% JPEG → ~150-300KB
      // (las fotos de celular sin comprimir pesan 5-10MB, esto reduce el consumo ~30x)
      const compressed = await compressImage(base64Data, 1200, 1200, 0.82);

      // Subir directamente a Cloudinary via API REST (sin dependencias npm)
      const formData = new FormData();
      formData.append('file', compressed);
      formData.append('upload_preset', 'sistema-gamt-uploads');
      formData.append('folder', `sistema-arboricultura/${folder}`);

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dlabhoodm/image/upload',
        { method: 'POST', body: formData }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Imagen subida a Cloudinary:', data.secure_url);
      return data.secure_url;
    } catch (error) {
      // Fallback: comprimir agresivamente y guardar como Base64 en Firestore
      // (solo si Cloudinary no está disponible temporalmente)
      console.warn('⚠️ Cloudinary no disponible, usando Base64 comprimido en Firestore:', error.message);
      const compressed = await compressImage(base64Data, 500, 500, 0.6);
      return compressed;
    }
  }

  // --- Helper para registrar auditoría ---
  async function registrarAuditoria(datos) {
    try {
      const collRef = collection(db, 'auditoria');
      const docRef = doc(collRef);
      const cleanDetalles = datos.detalles ? (typeof datos.detalles === 'object' ? JSON.stringify(datos.detalles) : String(datos.detalles)) : null;

      await setDoc(docRef, {
        id: docRef.id,
        usuario: uiState.user?.nombre || 'SISTEMA',
        role: uiState.user?.role || 'SISTEMA',
        accion: datos.accion,
        tabla_afectada: datos.tabla_afectada,
        registro_id: String(datos.registro_id),
        detalles: cleanDetalles,
        fecha_hora: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ ERROR AL GUARDAR REGISTRO DE AUDITORÍA:', error);
    }
  }

  // --- Helper de Registro de Usuarios en Firebase Auth Secundario ---
  async function registerUserInSecondaryApp(email, password) {
    const appName = `tempApp_${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, appName);
    const tempAuth = getSecondaryAuth(tempApp);
    try {
      const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
      const newUid = userCredential.user.uid;
      await tempAuth.signOut();
      await deleteApp(tempApp);
      return newUid;
    } catch (error) {
      console.error("Error in secondary auth app:", error);
      try {
        await deleteApp(tempApp);
      } catch (e) {}
      throw error;
    }
  }

  // --- Sistema de Autenticación con Firebase Auth ---
  async function login(usernameInput, password) {
    try {
      // Buscar el correo del usuario en la colección 'personal' por su nombre o username
      let userDoc = null;
      const q = query(collection(db, 'personal'), where('nombre', '==', usernameInput));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        userDoc = querySnap.docs[0].data();
      } else {
        const q2 = query(collection(db, 'personal'), where('username', '==', usernameInput));
        const querySnap2 = await getDocs(q2);
        if (!querySnap2.empty) {
          userDoc = querySnap2.docs[0].data();
        }
      }

      if (!userDoc) {
        return { success: false, error: 'Usuario no encontrado.' };
      }

      if (userDoc.estado !== 'Activo') {
        return { success: false, error: 'Su cuenta ha sido suspendida por el administrador.' };
      }

      const email = userDoc.email;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Estructurar información de sesión
      const formattedUser = {
        id: userDoc.id,
        nombre: userDoc.nombre,
        username: userDoc.username,
        role: userDoc.role,
        cargo: userDoc.cargo,
        email: userDoc.email,
        estado: userDoc.estado,
        foto: userDoc.foto
      };

      uiState.user = formattedUser;
      uiState.token = await user.getIdToken();
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      uiState.loginTime = now;

      const userToSave = { ...formattedUser };
      delete userToSave.foto;
      localStorage.setItem('user', JSON.stringify(userToSave));
      localStorage.setItem('token', uiState.token);
      sessionStorage.setItem('loginTime', now);
      sessionStorage.setItem('loginTimeFull', new Date().toISOString());

      initFirebaseSync();

      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      let errMsg = 'Contraseña incorrecta. Intente de nuevo.';
      if (error.code === 'auth/network-request-failed') {
        errMsg = 'Error de conexión: El servidor no responde.';
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errMsg = 'Contraseña incorrecta. Intente de nuevo.';
      } else if (error.message) {
        errMsg = error.message;
      }
      return { success: false, error: errMsg };
    }
  }

  async function loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (!user.email) {
        await signOut(auth);
        return { success: false, error: 'No se pudo obtener el correo de su cuenta Google.' };
      }

      let userDoc = null;
      const q = query(collection(db, 'personal'), where('email', '==', user.email.toLowerCase().trim()));
      const querySnap = await getDocs(q);
      
      if (!querySnap.empty) {
        userDoc = querySnap.docs[0].data();
      } else {
        const q2 = query(collection(db, 'personal'), where('email', '==', user.email.trim()));
        const querySnap2 = await getDocs(q2);
        if (!querySnap2.empty) {
          userDoc = querySnap2.docs[0].data();
        }
      }

      if (!userDoc) {
        await signOut(auth);
        return { success: false, error: `El correo de Google (${user.email}) no está registrado en el sistema. Contacte al Administrador.` };
      }

      if (userDoc.estado !== 'Activo') {
        await signOut(auth);
        return { success: false, error: 'Su cuenta ha sido suspendida por el administrador.' };
      }

      const formattedUser = {
        id: userDoc.id,
        nombre: userDoc.nombre,
        username: userDoc.username,
        role: userDoc.role,
        cargo: userDoc.cargo,
        email: userDoc.email,
        estado: userDoc.estado,
        foto: userDoc.foto
      };

      uiState.user = formattedUser;
      uiState.token = await user.getIdToken();
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      uiState.loginTime = now;

      const userToSave = { ...formattedUser };
      delete userToSave.foto;
      localStorage.setItem('user', JSON.stringify(userToSave));
      localStorage.setItem('token', uiState.token);
      sessionStorage.setItem('loginTime', now);
      sessionStorage.setItem('loginTimeFull', new Date().toISOString());

      initFirebaseSync();

      return { success: true };
    } catch (error) {
      console.error('Error en Google Login:', error);
      let errMsg = 'Error al iniciar sesión con Google.';
      if (error.code === 'auth/network-request-failed') {
        errMsg = 'Error de conexión: El servidor no responde.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errMsg = 'El inicio de sesión fue cancelado por el usuario.';
      } else if (error.message) {
        errMsg = error.message;
      }
      return { success: false, error: errMsg };
    }
  }

  async function changeOwnPassword(currentPassword, newPassword) {
    try {
      if (!auth.currentUser || !auth.currentUser.email) {
        throw new Error("No hay una sesión activa de usuario.");
      }
      if (!newPassword || newPassword.length < 6) {
        throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
      }
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      
      await registrarAuditoria({
        accion: 'MODIFICAR_CONTRASEÑA',
        tabla_afectada: 'personal',
        registro_id: auth.currentUser.uid,
        detalles: { usuario: uiState.user?.username }
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error al cambiar contraseña propia:", error);
      let errMsg = error.message || "Error al actualizar contraseña.";
      if (error.code === 'auth/wrong-password') {
        errMsg = "La contraseña actual es incorrecta.";
      } else if (error.code === 'auth/weak-password') {
        errMsg = "La contraseña debe tener al menos 6 caracteres.";
      } else if (error.code === 'auth/network-request-failed') {
        errMsg = "Error de conexión con el servidor.";
      }
      return { success: false, error: errMsg };
    }
  }

  async function logout() {
    stopPresenceHeartbeat();
    if (auth.currentUser && uiState.user) {
      try {
        const docId = uiState.user.id;
        const userRef = doc(db, 'personal', String(docId));
        await updateDoc(userRef, {
          online: false,
          lastActive: serverTimestamp()
        });
      } catch (err) {
        console.error("Error al desconectar usuario en logout:", err);
      }
    }
    signOut(auth).catch(err => console.error("Error signing out:", err));
    uiState.user = null;
    uiState.token = null;
    uiState.loginTime = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('loginTime');
    sessionStorage.removeItem('loginTime');
    sessionStorage.removeItem('loginTimeFull');
    unsubscribeList.forEach(unsub => unsub());
    unsubscribeList = [];
  }

  function handleAuthError() {
    console.warn("Error de autenticación. Cerrando sesión...");
    logout();
    showToast("Sesión expirada. Por favor, inicie sesión nuevamente.", "error");
  }

  // --- Cola de Sincronización en Tiempo Real de Firebase ---
  let unsubscribeList = [];

  function initFirebaseSync() {
    unsubscribeList.forEach(unsub => unsub());
    unsubscribeList = [];

    uiState.isLoading = true;

    // 1. Personal & Usuarios
    const unsubPersonal = onSnapshot(collection(db, 'personal'), (snapshot) => {
      const allPersonal = [];
      snapshot.forEach(doc => {
        allPersonal.push(doc.data());
      });
      allPersonal.sort((a, b) => a.nombre.localeCompare(b.nombre));
      store.tecnicos = allPersonal.map(p => ({
        ...p,
        celular: p.celular || '',
        tipo_contrato: p.tipo_contrato || ''
      }));
      store.usuarios = allPersonal.filter(p => p.username && p.username.trim() !== '');

      // Cerrar sesión en tiempo real si el administrador desactiva su cuenta, le quita el acceso o se elimina su perfil
      if (uiState.user) {
        const matchingProfile = allPersonal.find(p => p.id === uiState.user.id);
        if (!matchingProfile || matchingProfile.estado !== 'Activo' || !matchingProfile.username) {
          logout();
          showToast("Su acceso ha sido revocado por el administrador.", "error");
        }
      }
    }, (error) => {
      console.error("Error sync personal:", error);
    });
    unsubscribeList.push(unsubPersonal);

    // 2. Solicitudes
    const unsubSolicitudes = onSnapshot(query(collection(db, 'solicitudes'), orderBy('createdAt', 'desc')), (snapshot) => {
      const allSolicitudes = [];
      snapshot.forEach(doc => {
        allSolicitudes.push(doc.data());
      });
      store.solicitudes = allSolicitudes;
    }, (error) => {
      console.error("Error sync solicitudes:", error);
    });
    unsubscribeList.push(unsubSolicitudes);

    // 3. Impresiones
    const unsubImpresiones = onSnapshot(query(collection(db, 'impresiones'), orderBy('fecha_impresion', 'desc')), (snapshot) => {
      const allImpresiones = [];
      snapshot.forEach(doc => {
        allImpresiones.push(doc.data());
      });
      store.impresiones = allImpresiones;
    }, (error) => {
      console.error("Error sync impresiones:", error);
    });
    unsubscribeList.push(unsubImpresiones);

    // 4. Inventario Items
    const unsubInvItems = onSnapshot(query(collection(db, 'inventario_items'), orderBy('nombre', 'asc')), (snapshot) => {
      const allItems = [];
      snapshot.forEach(doc => {
        allItems.push(doc.data());
      });
      store.inventarioItems = allItems;
    }, (error) => {
      console.error("Error sync inventario items:", error);
    });
    unsubscribeList.push(unsubInvItems);

    // 5. Inventario Activos
    const unsubInvActivos = onSnapshot(query(collection(db, 'inventario_activos'), orderBy('codigo_activo', 'asc')), (snapshot) => {
      const allActivos = [];
      snapshot.forEach(doc => {
        allActivos.push(doc.data());
      });
      store.inventarioActivos = allActivos;
    }, (error) => {
      console.error("Error sync inventario activos:", error);
    });
    unsubscribeList.push(unsubInvActivos);

    // 6. Inventario Consumibles
    const unsubInvConsumibles = onSnapshot(collection(db, 'inventario_consumibles'), (snapshot) => {
      const allConsumibles = [];
      snapshot.forEach(doc => {
        allConsumibles.push(doc.data());
      });
      store.inventarioConsumibles = allConsumibles;
    }, (error) => {
      console.error("Error sync inventario consumibles:", error);
    });
    unsubscribeList.push(unsubInvConsumibles);

    // 7. Inventario Movimientos
    const unsubInvMovimientos = onSnapshot(query(collection(db, 'inventario_movimientos'), orderBy('fecha_movimiento', 'desc')), (snapshot) => {
      const allMovimientos = [];
      snapshot.forEach(doc => {
        allMovimientos.push(doc.data());
      });
      allMovimientos.sort((a, b) => b.id_movimiento - a.id_movimiento);
      store.inventarioMovimientos = allMovimientos;
    }, (error) => {
      console.error("Error sync inventario movimientos:", error);
    });
    unsubscribeList.push(unsubInvMovimientos);

    // 8. Config
    const unsubConfig = onSnapshot(doc(db, 'config', 'sistema'), (docSnap) => {
      if (docSnap.exists()) {
        const config = docSnap.data();
        store.config = config;
        
        // Solo actualizar el logo si Firestore tiene un valor definido
        // (puede ser una URL pública o un Base64 comprimido como fallback CORS)
        if (config.logo_app !== undefined && config.logo_app !== null && config.logo_app !== '') {
          uiState.logo_app = config.logo_app;
          try {
            localStorage.setItem('logo_app', config.logo_app);
          } catch (e) {
            console.warn('localStorage lleno, logo_app solo en memoria:', e.message);
          }
        } else if (config.logo_app === '') {
          // Solo borrar si explícitamente se guardó cadena vacía (acción "Remover")
          uiState.logo_app = null;
          localStorage.removeItem('logo_app');
        }
        // Si config.logo_app es undefined, mantener lo que ya hay en uiState (que puede ser del localStorage inicial)
        
        if (config.logo_institucional !== undefined && config.logo_institucional !== null && config.logo_institucional !== '') {
          uiState.logo_institucional = config.logo_institucional;
          try {
            localStorage.setItem('logo_institucional', config.logo_institucional);
          } catch (e) {
            console.warn('localStorage lleno, logo_institucional solo en memoria:', e.message);
          }
        } else if (config.logo_institucional === '') {
          // Solo borrar si explícitamente se guardó cadena vacía (acción "Remover")
          uiState.logo_institucional = null;
          localStorage.removeItem('logo_institucional');
        }
      }
      uiState.isLoading = false;
    }, (error) => {
      console.error("Error sync config:", error);
      uiState.isLoading = false;
    });
    unsubscribeList.push(unsubConfig);
  }

  let presenceInterval = null;

  async function updatePresence(isOnline) {
    if (!auth.currentUser || !uiState.user) return;
    try {
      const docId = uiState.user.id;
      const userRef = doc(db, 'personal', String(docId));
      await updateDoc(userRef, {
        online: isOnline,
        lastActive: serverTimestamp()
      });
    } catch (error) {
      console.error("Error actualizando presencia:", error);
    }
  }

  const handleUnload = () => {
    if (auth.currentUser && uiState.user) {
      const docId = uiState.user.id;
      const userRef = doc(db, 'personal', String(docId));
      updateDoc(userRef, {
        online: false,
        lastActive: serverTimestamp()
      }).catch(() => {});
    }
  };

  function startPresenceHeartbeat() {
    stopPresenceHeartbeat();
    updatePresence(true);
    presenceInterval = setInterval(() => {
      updatePresence(true);
    }, 60000);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
  }

  function stopPresenceHeartbeat() {
    if (presenceInterval) {
      clearInterval(presenceInterval);
      presenceInterval = null;
    }
    window.removeEventListener('beforeunload', handleUnload);
    window.removeEventListener('pagehide', handleUnload);
  }

  // Escuchar el estado de Firebase Auth para persistencia automática offline/online
  onAuthStateChanged(auth, (user) => {
    if (user) {
      uiState.token = 'firebase-auth-active';
      
      const email = user.email ? user.email.toLowerCase().trim() : '';
      const q = query(collection(db, 'personal'), where('email', '==', email));
      
      getDocs(q).then((querySnap) => {
        if (!querySnap.empty) {
          return querySnap.docs[0].data();
        } else {
          // Fallback: buscar por uid
          const userRef = doc(db, 'personal', String(user.uid));
          return getDoc(userRef).then((docSnap) => {
            if (docSnap.exists()) {
              return docSnap.data();
            }
            return null;
          });
        }
      }).then((profile) => {
        if (profile) {
          if (profile.estado !== 'Activo' || !profile.username) {
            logout();
            showToast("Su acceso ha sido revocado por el administrador.", "error");
            return;
          }
          const formattedUser = {
            id: profile.id,
            nombre: profile.nombre,
            username: profile.username,
            role: profile.role,
            cargo: profile.cargo,
            email: profile.email,
            estado: profile.estado,
            foto: profile.foto
          };
          uiState.user = formattedUser;
          const userToSave = { ...formattedUser };
          delete userToSave.foto;
          localStorage.setItem('user', JSON.stringify(userToSave));

          // Calcular desconexión previa por tiempo o clock skew
          let lastActiveMs = 0;
          if (profile.lastActive) {
            if (typeof profile.lastActive.toDate === 'function') {
              lastActiveMs = profile.lastActive.toDate().getTime();
            } else if (profile.lastActive.seconds) {
              lastActiveMs = profile.lastActive.seconds * 1000;
            } else {
              lastActiveMs = new Date(profile.lastActive).getTime();
            }
          }
          const nowMs = Date.now();
          const wasDisconnected = !lastActiveMs || Math.abs(nowMs - lastActiveMs) > 300000; // 5 minutos

          if (!sessionStorage.getItem('loginTime') || wasDisconnected) {
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            uiState.loginTime = now;
            sessionStorage.setItem('loginTime', now);
            sessionStorage.setItem('loginTimeFull', new Date().toISOString());
          } else {
            uiState.loginTime = sessionStorage.getItem('loginTime');
          }
          
          initFirebaseSync();
          startPresenceHeartbeat();
        } else {
          // Fallback if profile doesn't exist yet in personal collection
          if (!sessionStorage.getItem('loginTime')) {
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            uiState.loginTime = now;
            sessionStorage.setItem('loginTime', now);
            sessionStorage.setItem('loginTimeFull', new Date().toISOString());
          } else {
            uiState.loginTime = sessionStorage.getItem('loginTime');
          }
          initFirebaseSync();
          startPresenceHeartbeat();
        }
      }).catch((error) => {
        console.error("Error al restaurar sesión en onAuthStateChanged:", error);
        initFirebaseSync();
        startPresenceHeartbeat();
      });
    } else {
      logout();
    }
  });

  // --- Carga de Catálogos Estáticos de Firestore ---
  async function fetchCatalogos() {
    uiState.isLoading = true;
    try {
      const docIds = ['barrios', 'distritos', 'acciones', 'especies', 'instituciones', 'tipos_institucion'];
      for (const docId of docIds) {
        const docRef = doc(db, 'catalogos', docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (docId === 'barrios') store.barrios = data.items || [];
          else if (docId === 'distritos') store.distritos = data.items || [];
          else if (docId === 'acciones') store.acciones = data.items || [];
          else if (docId === 'especies') store.especies = data.items || [];
          else if (docId === 'instituciones') store.instituciones = data.items || [];
          else if (docId === 'tipos_institucion') store.tipos_institucion = data.items || [];
        }
      }
      
      if (auth.currentUser) {
        initFirebaseSync();
      }
      console.log("Catálogos base cargados desde Firestore.");
    } catch (error) {
      console.error("Error al cargar los catálogos:", error);
    } finally {
      uiState.isLoading = false;
    }
  }

  // --- CONFIGURACIÓN DEL SISTEMA ---
  async function fetchConfig() {
    try {
      const docSnap = await getDoc(doc(db, 'config', 'sistema'));
      if (docSnap.exists()) {
        store.config = docSnap.data();
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error);
    }
  }

  async function updateConfig(datos) {
    try {
      const docRef = doc(db, 'config', 'sistema');
      
      // Manejar carga de logotipos si vienen en Base64
      if (datos.logo_app) {
        datos.logo_app = await uploadImage(datos.logo_app, 'config');
      }
      if (datos.logo_institucional) {
        datos.logo_institucional = await uploadImage(datos.logo_institucional, 'config');
      }

      await setDoc(docRef, datos, { merge: true });

      await registrarAuditoria({
        accion: 'MODIFICAR',
        tabla_afectada: 'config_sistema',
        registro_id: 'sistema',
        detalles: datos
      });
      return true;
    } catch (error) {
      console.error("Error al actualizar configuración:", error);
      return false;
    }
  }

  // --- HISTORIAL DE IMPRESIONES ---
  async function fetchImpresiones() {
    // Sincronizado en tiempo real
  }

  async function registrarImpresion(datos) {
    try {
      const collRef = collection(db, 'impresiones');
      const docRef = doc(collRef);
      const id = docRef.id;
      const dataToSave = {
        id: id,
        nombre_reporte: datos.nombre_reporte || `${datos.tipo_reporte} - ${new Date().toLocaleDateString()}`,
        id_solicitud: datos.id_solicitud || null,
        tipo_reporte: datos.tipo_reporte,
        usuario: uiState.user?.nombre || 'Desconocido',
        fecha_impresion: serverTimestamp(),
        filtros_aplicados: datos.filtros_aplicados || null,
        filtros_snapshot: datos.filtros_snapshot || null,
        detalles: datos.detalles || null,
        comunicacion_interna: datos.comunicacion_interna || null
      };
      await setDoc(docRef, dataToSave);
      return true;
    } catch (error) {
      console.error("Error al registrar impresión:", error);
      return false;
    }
  }

  async function deleteImpresion(id) {
    try {
      const docRef = doc(db, 'impresiones', String(id));
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error al eliminar impresión:", error);
      return false;
    }
  }

  async function updateImpresionName(id, nuevoNombre) {
    try {
      const docRef = doc(db, 'impresiones', String(id));
      await updateDoc(docRef, { nombre_reporte: nuevoNombre });
      return true;
    } catch (error) {
      console.error("Error al actualizar nombre de impresión:", error);
      return false;
    }
  }

  // --- GESTIÓN DE USUARIOS ---
  async function fetchPublicUsuarios() {
    try {
      const collRef = collection(db, 'personal');
      const querySnap = await getDocs(collRef);
      const list = [];
      querySnap.forEach(docSnap => {
        const p = docSnap.data();
        if (p.estado === 'Activo' && p.username && p.username.trim() !== '') {
          list.push({
            nombre: p.nombre,
            username: p.username || '',
            role: p.role,
            cargo: p.cargo,
            foto: p.foto
          });
        }
      });
      return list;
    } catch (error) {
      console.error("Error al cargar usuarios públicos:", error);
      return [];
    }
  }

  async function fetchUsuarios() {
    // Sincronizado en tiempo real
  }

  async function addUsuario(usuario) {
    try {
      if (!usuario.password) {
        return 'La contraseña es requerida para un nuevo usuario.';
      }

      const email = usuario.email || `${usuario.username}@sistemaskoffys.com`;

      // Validar nombre de usuario único
      const q = query(collection(db, 'personal'), where('username', '==', usuario.username));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        return 'El nombre de usuario ya está registrado.';
      }

      // Subir foto si existe
      if (usuario.foto) {
        usuario.foto = await uploadImage(usuario.foto, 'profiles');
      }

      // Registrar credenciales en Auth secundario
      const authUid = await registerUserInSecondaryApp(email, usuario.password);

      const newUserDoc = {
        id: authUid,
        nombre: usuario.nombre,
        cedula_id: usuario.cedula_id || `GEN_${Date.now()}`,
        cargo: usuario.cargo || 'Usuario del Sistema',
        celular: usuario.celular || null,
        tipo_contrato: usuario.tipo_contrato || null,
        username: usuario.username,
        role: usuario.role,
        email: email,
        estado: usuario.estado || 'Activo',
        foto: usuario.foto || null,
        id_equipo: usuario.id_equipo || null,
        rol_equipo: usuario.rol_equipo || null,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'personal', authUid), newUserDoc);

      await registrarAuditoria({
        accion: 'CREAR',
        tabla_afectada: 'personal',
        registro_id: authUid,
        detalles: { usuario: usuario.username, role: usuario.role, cargo: usuario.cargo }
      });

      return true;
    } catch (error) {
      console.error('Error al agregar usuario:', error);
      return error.message || 'Error en el servidor';
    }
  }

  async function deleteUsuario(id) {
    try {
      const docRef = doc(db, 'personal', String(id));
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.role === 'ROOT') {
          return 'Acción bloqueada: No se puede revocar el acceso al usuario ROOT principal.';
        }
      }
      
      await updateDoc(docRef, {
        username: null,
        role: 'TECNICO'
      });

      await registrarAuditoria({
        accion: 'ELIMINAR',
        tabla_afectada: 'personal',
        registro_id: String(id),
        detalles: { status: 'Acceso revocado' }
      });

      return true;
    } catch (error) {
      console.error('Error al revocar acceso:', error);
      return false;
    }
  }

  async function updateUsuario(id, usuario) {
    try {
      const docRef = doc(db, 'personal', String(id));
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return 'Usuario no encontrado.';
      }

      const existingData = docSnap.data();

      if (existingData.role === 'ROOT') {
        if (usuario.role !== 'ROOT') {
          return 'No se puede quitar el rol ROOT al usuario principal.';
        }
        if (usuario.estado === 'Inactivo') {
          return 'No puedes auto-suspender al ROOT principal.';
        }
      }

      if (usuario.foto) {
        usuario.foto = await uploadImage(usuario.foto, 'profiles');
      }

      const updates = {
        nombre: usuario.nombre,
        role: usuario.role,
        cargo: usuario.cargo,
        email: usuario.email,
        estado: usuario.estado,
        username: usuario.username,
        cedula_id: usuario.cedula_id || existingData.cedula_id,
        celular: usuario.celular || null,
        tipo_contrato: usuario.tipo_contrato || null,
        id_equipo: usuario.id_equipo || null,
        rol_equipo: usuario.rol_equipo || null
      };

      if (usuario.foto !== undefined) {
        updates.foto = usuario.foto;
      }

      await updateDoc(docRef, updates);

      await registrarAuditoria({
        accion: 'MODIFICAR',
        tabla_afectada: 'personal',
        registro_id: String(id),
        detalles: { usuario: usuario.username, role: usuario.role, cargo: usuario.cargo, estado: usuario.estado }
      });

      return true;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      return error.message || 'Error en el servidor';
    }
  }

  async function restablecerPasswordPorCorreo(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error("Error al enviar correo de restablecimiento:", error);
      return error.message || 'Error en el servidor';
    }
  }

  // --- GESTIÓN DE SOLICITUDES ---
  async function fetchSolicitudes() {
    // Sincronizado en tiempo real
  }

  async function addSolicitud(solicitud) {
    try {
      const collRef = collection(db, 'solicitudes');
      const docRef = doc(collRef);
      const id_solicitud = docRef.id;

      if (solicitud.comunicacion_interna && solicitud.comunicacion_interna.trim() !== '') {
        const q = query(collection(db, 'solicitudes'), where('comunicacion_interna', '==', solicitud.comunicacion_interna.trim()));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          return { success: false, error: `El código de comunicación interna ya existe.` };
        }
      }

      // Generar código anual secuencial
      const currentYear = new Date().getFullYear();
      const yearSuffix = String(currentYear).slice(-2);
      const yearStart = new Date(currentYear, 0, 1).toISOString().split('T')[0];
      const qYear = query(collection(db, 'solicitudes'), where('fecha_ingreso', '>=', yearStart));
      const querySnapYear = await getDocs(qYear);
      const nextNum = querySnapYear.size + 1;
      const codigo_anual = `${String(nextNum).padStart(3, '0')}/${yearSuffix}`;

      let lat = null;
      let lng = null;
      if (solicitud.lat !== undefined && solicitud.lat !== null && solicitud.lat !== '') {
        lat = parseFloat(solicitud.lat);
      }
      if (solicitud.lng !== undefined && solicitud.lng !== null && solicitud.lng !== '') {
        lng = parseFloat(solicitud.lng);
      }
      const gps = (lat && lng) ? `${lat}, ${lng}` : null;

      // Subir fotos de los árboles
      let arbolesList = solicitud.arboles || [];
      for (const arb of arbolesList) {
        if (arb.url_foto) {
          arb.url_foto = await uploadImage(arb.url_foto, 'solicitudes');
        }
      }

      const docData = {
        id_solicitud: id_solicitud,
        codigo_anual: codigo_anual,
        fecha_ingreso: solicitud.fecha_ingreso || new Date().toISOString().split('T')[0],
        comunicacion_interna: solicitud.comunicacion_interna || null,
        id_tipo_institucion: solicitud.id_tipo_institucion || null,
        id_nombre_institucional: solicitud.id_nombre_institucional || null,
        solicitante_nombre: solicitud.solicitante_nombre || '',
        solicitante_telefono: solicitud.solicitante_telefono || null,
        solicitante_descripcion: solicitud.solicitante_descripcion || null,
        id_distrito: solicitud.id_distrito || null,
        id_barrio: solicitud.id_barrio || null,
        calle: solicitud.calle || null,
        numero_casa: solicitud.numero_casa || null,
        referencia: solicitud.referencia || null,
        ubicacion_gps: gps,
        lat: lat,
        lng: lng,
        fecha_verificacion: solicitud.fecha_verificacion || null,
        id_tecnico_verificacion: solicitud.id_tecnico_verificacion || null,
        esta_verificado: solicitud.fecha_verificacion ? 'Sí' : 'No',
        observacion_verificacion: solicitud.observacion_verificacion || null,
        requiere_plataforma: !!solicitud.requiere_plataforma,
        requiere_ficha_tecnica: !!solicitud.requiere_ficha_tecnica,
        procede: !!solicitud.procede,
        arbol_seco: !!solicitud.arbol_seco,
        es_emergencia: !!solicitud.es_emergencia,
        nivel_urgencia: solicitud.nivel_urgencia || 'Media',
        estado_tramite: solicitud.estado_tramite || 'En espera',
        fecha_ejecucion: solicitud.fecha_ejecucion || null,
        fecha_programada: solicitud.fecha_programada || null,
        id_tecnico_ejecucion: solicitud.id_tecnico_ejecucion || null,
        observaciones_finales: solicitud.observaciones_finales || null,
        trabajos_extra: solicitud.trabajos_extra || 'Ninguno',
        arboles: arbolesList,
        createdAt: serverTimestamp()
      };

      await setDoc(docRef, docData);

      await registrarAuditoria({
        accion: 'CREAR',
        tabla_afectada: 'solicitudes_poda',
        registro_id: id_solicitud,
        detalles: { codigo_anual, solicitante: docData.solicitante_nombre }
      });

      return { success: true, id_solicitud, codigo_anual };
    } catch (error) {
      console.error("Error al guardar solicitud:", error);
      return { success: false, error: error.message || 'Error de conexión' };
    }
  }

  async function deleteSolicitud(id) {
    try {
      const docRef = doc(db, 'solicitudes', String(id));
      await deleteDoc(docRef);
      
      await registrarAuditoria({
        accion: 'ELIMINAR',
        tabla_afectada: 'solicitudes_poda',
        registro_id: String(id),
        detalles: { id_solicitud: id }
      });
      return true;
    } catch (error) {
      console.error('Error al eliminar solicitud:', error);
      return false;
    }
  }

  async function updateSolicitud(id, datos) {
    try {
      const docRef = doc(db, 'solicitudes', String(id));

      if (datos.comunicacion_interna && datos.comunicacion_interna.trim() !== '') {
        const q = query(
          collection(db, 'solicitudes'), 
          where('comunicacion_interna', '==', datos.comunicacion_interna.trim())
        );
        const querySnap = await getDocs(q);
        const dup = querySnap.docs.find(d => d.id !== String(id));
        if (dup) {
          return { success: false, error: `El código de comunicación interna ya existe.` };
        }
      }

      let lat = null;
      let lng = null;
      if (datos.lat !== undefined && datos.lat !== null && datos.lat !== '') {
        lat = parseFloat(datos.lat);
      }
      if (datos.lng !== undefined && datos.lng !== null && datos.lng !== '') {
        lng = parseFloat(datos.lng);
      }
      const gps = (lat && lng) ? `${lat}, ${lng}` : null;

      // Subir fotos de los árboles
      let arbolesList = datos.arboles || [];
      for (const arb of arbolesList) {
        if (arb.url_foto) {
          arb.url_foto = await uploadImage(arb.url_foto, 'solicitudes');
        }
      }

      const updates = {
        fecha_ingreso: datos.fecha_ingreso || null,
        comunicacion_interna: datos.comunicacion_interna || null,
        id_tipo_institucion: datos.id_tipo_institucion || null,
        id_nombre_institucional: datos.id_nombre_institucional || null,
        solicitante_nombre: datos.solicitante_nombre || '',
        solicitante_telefono: datos.solicitante_telefono || null,
        solicitante_descripcion: datos.solicitante_descripcion || null,
        id_distrito: datos.id_distrito || null,
        id_barrio: datos.id_barrio || null,
        calle: datos.calle || null,
        numero_casa: datos.numero_casa || null,
        referencia: datos.referencia || null,
        ubicacion_gps: gps,
        lat: lat,
        lng: lng,
        fecha_verificacion: datos.fecha_verificacion || null,
        id_tecnico_verificacion: datos.id_tecnico_verificacion || null,
        esta_verificado: datos.fecha_verificacion ? 'Sí' : 'No',
        observacion_verificacion: datos.observacion_verificacion || null,
        requiere_plataforma: !!datos.requiere_plataforma,
        requiere_ficha_tecnica: !!datos.requiere_ficha_tecnica,
        procede: !!datos.procede,
        arbol_seco: !!datos.arbol_seco,
        es_emergencia: !!datos.es_emergencia,
        nivel_urgencia: datos.nivel_urgencia || 'Media',
        estado_tramite: datos.estado_tramite || 'En espera',
        fecha_ejecucion: datos.fecha_ejecucion || null,
        fecha_programada: datos.fecha_programada || null,
        id_tecnico_ejecucion: datos.id_tecnico_ejecucion || null,
        observaciones_finales: datos.observaciones_finales || null,
        trabajos_extra: datos.trabajos_extra || 'Ninguno',
        arboles: arbolesList
      };

      await updateDoc(docRef, updates);

      await registrarAuditoria({
        accion: 'MODIFICAR',
        tabla_afectada: 'solicitudes_poda',
        registro_id: String(id),
        detalles: { estado_tramite: updates.estado_tramite, solicitante: updates.solicitante_nombre }
      });

      return { success: true };
    } catch (error) {
      console.error("Error al actualizar solicitud:", error);
      return { success: false, error: error.message || 'Error al actualizar' };
    }
  }

  // --- GESTIÓN DE CATÁLOGOS (DINÁMICO) ---
  function getDocIdFromTabla(tabla) {
    const map = {
      acciones: 'acciones',
      especies: 'especies',
      tipos_institucion: 'tipos_institucion',
      instituciones: 'instituciones',
      distritos: 'distritos',
      barrios: 'barrios'
    };
    return map[tabla] || tabla;
  }

  async function addCatalogo(tabla, datos) {
    try {
      if (tabla === 'personal' || tabla === 'tecnicos') {
        const UNIQUE_CARGOS = ['Responsable de Área', 'Jefe de Unidad', 'Técnico de sistemas'];
        if (datos.cargo && UNIQUE_CARGOS.includes(datos.cargo)) {
          const existente = store.tecnicos.find(t => t.cargo === datos.cargo);
          if (existente) {
            return `Ya existe un funcionario asignado como "${datos.cargo}" (${existente.nombre}). Este cargo es único e indivisible.`;
          }
        }

        let id = String(datos.id || Date.now());
        
        if (datos.username && datos.password) {
          const email = datos.email || `${datos.username.toLowerCase().replace(/\s+/g, '')}@sistemaskoffys.com`;
          try {
            const authUid = await registerUserInSecondaryApp(email, datos.password);
            id = authUid;
          } catch (authErr) {
            const errStr = authErr.code || authErr.message || '';
            if (errStr.includes('auth/email-already-in-use')) {
              console.warn("User already exists in Firebase Auth. Re-using existing auth account.");
            } else {
              throw authErr;
            }
          }
          datos.email = email;
        }

        const docRef = doc(db, 'personal', id);
        
        if (datos.foto && datos.foto.startsWith('data:image')) {
          try {
            datos.foto = await uploadImage(datos.foto, 'profiles');
          } catch (fotoError) {
            console.error('Error al procesar foto en addCatalogo:', fotoError);
            datos.foto = null;
          }
        }

        const formatted = {
          id: Number(id) || id,
          nombre: datos.nombre,
          cedula_id: datos.cedula_id || `GEN_${Date.now()}`,
          cargo: datos.cargo || 'Técnico',
          celular: datos.celular || null,
          tipo_contrato: datos.tipo_contrato || null,
          username: datos.username || null,
          role: datos.role || 'TECNICO',
          email: datos.email || '',
          estado: datos.estado || 'Activo',
          foto: datos.foto || null,
          id_equipo: datos.id_equipo || null,
          rol_equipo: datos.rol_equipo || null,
          fecha_ingreso: datos.fecha_ingreso || null,
          fecha_nacimiento: datos.fecha_nacimiento || null,
          tipo_sangre: datos.tipo_sangre || null,
          contacto_emergencia: datos.contacto_emergencia || null,
          celular_emergencia: datos.celular_emergencia || null,
          createdAt: serverTimestamp()
        };
        await setDoc(docRef, formatted);
        return true;
      }

      const docId = getDocIdFromTabla(tabla);
      const docRef = doc(db, 'catalogos', docId);
      const docSnap = await getDoc(docRef);
      let items = [];
      if (docSnap.exists()) {
        items = docSnap.data().items || [];
      }
      const nextId = items.reduce((max, item) => item.id > max ? item.id : max, 0) + 1;
      const newItem = { id: nextId, ...datos };
      items.push(newItem);
      await setDoc(docRef, { items, lastUpdated: serverTimestamp() });
      
      await fetchCatalogos();
      return true;
    } catch (error) {
      console.error(`Error al agregar en catalogo ${tabla}:`, error);
      const errStr = error.code || error.message || '';
      if (errStr.includes('auth/email-already-in-use')) {
        return 'El correo institucional o usuario ya se encuentra registrado en el sistema.';
      }
      if (errStr.includes('auth/weak-password')) {
        return 'La contraseña es muy débil (debe tener al menos 6 caracteres).';
      }
      if (errStr.includes('auth/invalid-email')) {
        return 'El formato del correo electrónico no es válido.';
      }
      return error.message || 'Error al agregar en catálogo';
    }
  }

  async function updateCatalogo(tabla, id, datos) {
    try {
      if (tabla === 'personal' || tabla === 'tecnicos') {
        const UNIQUE_CARGOS = ['Responsable de Área', 'Jefe de Unidad', 'Técnico de sistemas'];
        if (datos.cargo && UNIQUE_CARGOS.includes(datos.cargo)) {
          const existente = store.tecnicos.find(t => t.cargo === datos.cargo && String(t.id) !== String(id));
          if (existente) {
            return `Ya existe un funcionario asignado como "${datos.cargo}" (${existente.nombre}). Este cargo es único e indivisible.`;
          }
        }

        const docRef = doc(db, 'personal', String(id));
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return false;
        const existingData = docSnap.data();

        if (datos.username && !existingData.username) {
          if (!datos.password) {
            throw new Error('La contraseña es requerida para habilitar el acceso.');
          }
          const email = datos.email || `${datos.username.toLowerCase().replace(/\s+/g, '')}@sistemaskoffys.com`;
          try {
            await registerUserInSecondaryApp(email, datos.password);
          } catch (authError) {
            if (authError.code === 'auth/email-already-in-use') {
              console.warn("User already exists in Firebase Auth. Re-using existing auth account.");
            } else {
              throw authError;
            }
          }
          datos.email = email;
        }

        // Procesar foto de forma independiente: si falla, el resto del guardado continúa
        if (datos.foto && datos.foto.startsWith('data:image')) {
          try {
            datos.foto = await uploadImage(datos.foto, 'profiles');
          } catch (fotoError) {
            console.error('Error al procesar foto, se guardará sin actualizar la foto:', fotoError);
            datos.foto = existingData.foto || null; // Mantener la foto anterior
          }
        }

        const formatted = {
          nombre: datos.nombre,
          cedula_id: datos.cedula_id,
          cargo: datos.cargo,
          celular: datos.celular || null,
          tipo_contrato: datos.tipo_contrato || null,
          username: datos.username || null,
          role: datos.role || 'TECNICO',
          email: datos.email || '',
          estado: datos.estado || 'Activo',
          id_equipo: datos.id_equipo || null,
          rol_equipo: datos.rol_equipo || null,
          fecha_ingreso: datos.fecha_ingreso || null,
          fecha_nacimiento: datos.fecha_nacimiento || null,
          tipo_sangre: datos.tipo_sangre || null,
          contacto_emergencia: datos.contacto_emergencia || null,
          celular_emergencia: datos.celular_emergencia || null
        };

        if (datos.foto !== undefined) {
          formatted.foto = datos.foto;
        }

        await updateDoc(docRef, formatted);
        return true;
      }

      const docId = getDocIdFromTabla(tabla);
      const docRef = doc(db, 'catalogos', docId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return false;
      const items = docSnap.data().items || [];
      const idx = items.findIndex(item => item.id == id);
      if (idx !== -1) {
        items[idx] = { ...items[idx], ...datos, id: Number(id) };
        await setDoc(docRef, { items, lastUpdated: serverTimestamp() });
        await fetchCatalogos();
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error al actualizar en catalogo ${tabla}:`, error);
      const errStr = error.code || error.message || '';
      if (errStr.includes('auth/email-already-in-use')) {
        return 'El correo institucional o usuario ya se encuentra registrado en el sistema.';
      }
      if (errStr.includes('auth/weak-password')) {
        return 'La contraseña es muy débil (debe tener al menos 6 caracteres).';
      }
      if (errStr.includes('auth/invalid-email')) {
        return 'El formato del correo electrónico no es válido.';
      }
      return error.message || 'Error al actualizar en catálogo';
    }
  }

  async function deleteCatalogo(tabla, id) {
    try {
      if (tabla === 'personal' || tabla === 'tecnicos') {
        const docRef = doc(db, 'personal', String(id));
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.role === 'ROOT') {
            return 'Acción bloqueada: No se puede eliminar al usuario ROOT.';
          }
        }
        await deleteDoc(docRef);
        return true;
      }

      const docId = getDocIdFromTabla(tabla);
      const docRef = doc(db, 'catalogos', docId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return false;
      let items = docSnap.data().items || [];
      items = items.filter(item => item.id != id);
      await setDoc(docRef, { items, lastUpdated: serverTimestamp() });
      await fetchCatalogos();
      return true;
    } catch (error) {
      console.error(`Error al eliminar de catalogo ${tabla}:`, error);
      return false;
    }
  }

  // --- CALENDARIO FESTIVO ---
  async function fetchCalendario() {
    try {
      const collRef = collection(db, 'calendario');
      const querySnap = await getDocs(collRef);
      const list = [];
      querySnap.forEach(docSnap => {
        list.push(docSnap.data());
      });
      return list;
    } catch (error) {
      console.error('Error al cargar calendario:', error);
      return [];
    }
  }

  async function addCalendarioEvento(evento) {
    try {
      if (evento.nombre_barrio && !evento.nombre_barrio.startsWith('Feriado:')) {
        const q = query(collection(db, 'calendario'), where('nombre_barrio', '==', evento.nombre_barrio));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          return { success: false, error: `El barrio "${evento.nombre_barrio}" ya tiene un aniversario registrado en el calendario.` };
        }
      }

      const docRef = doc(collection(db, 'calendario'));
      const id = Date.now(); // ID numérico
      await setDoc(docRef, {
        id: id,
        fecha_aniversario: evento.fecha_aniversario,
        nombre_barrio: evento.nombre_barrio,
        presidente_barrio: evento.presidente_barrio || null,
        telefono_presidente: evento.telefono_presidente || null,
        color_etiqueta: evento.color_etiqueta || '#4caf50',
        solicitudes_count: 0
      });
      return { success: true };
    } catch (error) {
      console.error('Error al agregar evento:', error);
      return { success: false, error: error.message || 'Error de conexión con el servidor' };
    }
  }

  async function updateCalendarioEvento(id, evento) {
    try {
      if (evento.nombre_barrio && !evento.nombre_barrio.startsWith('Feriado:')) {
        const q = query(collection(db, 'calendario'), where('nombre_barrio', '==', evento.nombre_barrio));
        const querySnap = await getDocs(q);
        const dup = querySnap.docs.find(d => d.data().id !== Number(id));
        if (dup) {
          return { success: false, error: `El barrio "${evento.nombre_barrio}" ya tiene un aniversario registrado.` };
        }
      }

      const q = query(collection(db, 'calendario'), where('id', '==', Number(id)));
      const querySnap = await getDocs(q);
      if (querySnap.empty) return { success: false, error: 'Evento no encontrado' };

      const docRef = querySnap.docs[0].ref;
      await updateDoc(docRef, {
        fecha_aniversario: evento.fecha_aniversario,
        nombre_barrio: evento.nombre_barrio,
        presidente_barrio: evento.presidente_barrio || null,
        telefono_presidente: evento.telefono_presidente || null,
        color_etiqueta: evento.color_etiqueta || '#4caf50'
      });
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar evento:', error);
      return { success: false, error: error.message || 'Error de conexión' };
    }
  }

  async function deleteCalendarioEvento(id) {
    try {
      const q = query(collection(db, 'calendario'), where('id', '==', Number(id)));
      const querySnap = await getDocs(q);
      if (querySnap.empty) return false;
      await deleteDoc(querySnap.docs[0].ref);
      return true;
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      return false;
    }
  }

  // --- AUDITORÍA DE ACTIVIDAD ---
  async function fetchAuditoria() {
    try {
      const q = query(collection(db, 'auditoria'), orderBy('fecha_hora', 'desc'));
      const querySnap = await getDocs(q);
      const list = [];
      querySnap.forEach(docSnap => {
        list.push(docSnap.data());
      });
      store.auditoria = list;
    } catch (error) {
      console.error("Error al cargar auditoría:", error);
    }
  }

  // --- CONTROL DE HERRAMIENTAS E INVENTARIO ---
  async function fetchInventarioItems() {
    // Sincronizado en tiempo real
  }

  async function addInventarioItem(item) {
    try {
      const docRef = doc(collection(db, 'inventario_items'));
      const id_item = docRef.id;
      const dataToSave = {
        id_item: id_item,
        nombre: item.nombre,
        tipo: item.tipo,
        descripcion: item.descripcion || null,
        unidad_medida: item.unidad_medida || 'Unidad'
      };
      await setDoc(docRef, dataToSave);

      if (item.tipo === 'Consumible' || item.tipo === 'Repuesto') {
        const stockRef = doc(collection(db, 'inventario_consumibles'));
        await setDoc(stockRef, {
          id_consumible: stockRef.id,
          id_item: id_item,
          cantidad_almacen: 0,
          cantidad_oficina: 0,
          cantidad_tecnicos: 0,
          item_nombre: item.nombre,
          item_tipo: item.tipo,
          unidad_medida: item.unidad_medida || 'Unidad'
        });
      }

      await registrarAuditoria({
        accion: 'CREAR',
        tabla_afectada: 'inventario_items',
        registro_id: id_item,
        detalles: { nombre: item.nombre, tipo: item.tipo }
      });

      return { success: true };
    } catch (error) {
      console.error("Error al agregar ítem:", error);
      return { success: false, error: error.message };
    }
  }

  async function updateInventarioItem(id, item) {
    try {
      const docRef = doc(db, 'inventario_items', String(id));
      await updateDoc(docRef, {
        nombre: item.nombre,
        tipo: item.tipo,
        descripcion: item.descripcion || null,
        unidad_medida: item.unidad_medida || 'Unidad'
      });

      if (item.tipo === 'Consumible' || item.tipo === 'Repuesto') {
        const q = query(collection(db, 'inventario_consumibles'), where('id_item', '==', String(id)));
        const querySnap = await getDocs(q);
        if (querySnap.empty) {
          const stockRef = doc(collection(db, 'inventario_consumibles'));
          await setDoc(stockRef, {
            id_consumible: stockRef.id,
            id_item: String(id),
            cantidad_almacen: 0,
            cantidad_oficina: 0,
            cantidad_tecnicos: 0,
            item_nombre: item.nombre,
            item_tipo: item.tipo,
            unidad_medida: item.unidad_medida || 'Unidad'
          });
        } else {
          const stockDocRef = querySnap.docs[0].ref;
          await updateDoc(stockDocRef, {
            item_nombre: item.nombre,
            item_tipo: item.tipo,
            unidad_medida: item.unidad_medida || 'Unidad'
          });
        }
      }

      await registrarAuditoria({
        accion: 'MODIFICAR',
        tabla_afectada: 'inventario_items',
        registro_id: String(id),
        detalles: { nombre: item.nombre, tipo: item.tipo }
      });

      return { success: true };
    } catch (error) {
      console.error("Error al actualizar ítem:", error);
      return { success: false, error: error.message };
    }
  }

  async function deleteInventarioItem(id) {
    try {
      const qActivos = query(collection(db, 'inventario_activos'), where('id_item', '==', String(id)));
      const snapActivos = await getDocs(qActivos);
      if (!snapActivos.empty) {
        return { success: false, error: 'No se puede eliminar este ítem porque tiene activos codificados asociados.' };
      }

      const qMovimientos = query(collection(db, 'inventario_movimientos'), where('id_item', '==', String(id)));
      const snapMovimientos = await getDocs(qMovimientos);
      if (!snapMovimientos.empty) {
        return { success: false, error: 'No se puede eliminar este ítem porque tiene movimientos de stock registrados.' };
      }

      await deleteDoc(doc(db, 'inventario_items', String(id)));
      
      const qConsumibles = query(collection(db, 'inventario_consumibles'), where('id_item', '==', String(id)));
      const snapConsumibles = await getDocs(qConsumibles);
      if (!snapConsumibles.empty) {
        await deleteDoc(snapConsumibles.docs[0].ref);
      }

      await registrarAuditoria({
        accion: 'ELIMINAR',
        tabla_afectada: 'inventario_items',
        registro_id: String(id),
        detalles: { id }
      });

      return { success: true };
    } catch (error) {
      console.error("Error al eliminar ítem:", error);
      return { success: false, error: error.message };
    }
  }

  async function fetchInventarioActivos() {
    // Sincronizado en tiempo real
  }

  async function addInventarioActivo(activo) {
    try {
      const docRef = doc(collection(db, 'inventario_activos'));
      const id_activo = docRef.id;

      const itemDoc = store.inventarioItems.find(i => i.id_item === String(activo.id_item));
      const item_nombre = itemDoc ? itemDoc.nombre : 'Desconocido';

      const custodioDoc = store.tecnicos.find(t => t.id === Number(activo.id_custodio));
      const custodio_nombre = custodioDoc ? custodioDoc.nombre : null;

      const operarioDoc = store.tecnicos.find(t => t.id === Number(activo.id_usuario_operario));
      const operario_nombre = operarioDoc ? operarioDoc.nombre : null;

      // Subir fotos
      if (activo.foto_lateral_anterior) activo.foto_lateral_anterior = await uploadImage(activo.foto_lateral_anterior, 'activos');
      if (activo.foto_lateral_actual) activo.foto_lateral_actual = await uploadImage(activo.foto_lateral_actual, 'activos');
      if (activo.foto_superior_anterior) activo.foto_superior_anterior = await uploadImage(activo.foto_superior_anterior, 'activos');
      if (activo.foto_superior_actual) activo.foto_superior_actual = await uploadImage(activo.foto_superior_actual, 'activos');

      const insertData = {
        id_activo: id_activo,
        id_item: String(activo.id_item),
        modelo: activo.modelo || null,
        marca: activo.marca || null,
        procedencia: activo.procedencia || null,
        capacidad: activo.capacidad || null,
        potencia_hp: activo.potencia_hp || null,
        cilindrada_cm3: activo.cilindrada_cm3 || null,
        motor: activo.motor || null,
        peso_kg: activo.peso_kg || null,
        longitud_espada: activo.longitud_espada || null,
        cadena: activo.cadena || null,
        paso_cadena: activo.paso_cadena || null,
        fecha_adquisicion: activo.fecha_adquisicion || null,
        numero_chasis: activo.numero_chasis,
        codigo_activo: activo.codigo_activo,
        estado: activo.estado || 'Bueno',
        uso: activo.uso || 'Moderado',
        ubicacion_actual: activo.ubicacion_actual || 'Almacén',
        id_custodio: activo.id_custodio || null,
        id_usuario_operario: activo.id_usuario_operario || null,
        observaciones: activo.observaciones || null,
        foto_lateral_anterior: activo.foto_lateral_anterior || null,
        foto_lateral_actual: activo.foto_lateral_actual || null,
        foto_superior_anterior: activo.foto_superior_anterior || null,
        foto_superior_actual: activo.foto_superior_actual || null,
        item_nombre,
        custodio_nombre,
        operario_nombre
      };

      await setDoc(docRef, insertData);

      await registrarAuditoria({
        accion: 'CREAR',
        tabla_afectada: 'inventario_activos',
        registro_id: id_activo,
        detalles: { codigo_activo: insertData.codigo_activo, numero_chasis: insertData.numero_chasis }
      });

      return { success: true };
    } catch (error) {
      console.error("Error al agregar activo:", error);
      return { success: false, error: error.message };
    }
  }

  async function updateInventarioActivo(id, activo) {
    try {
      const docRef = doc(db, 'inventario_activos', String(id));

      const custodioDoc = store.tecnicos.find(t => t.id === Number(activo.id_custodio));
      const custodio_nombre = custodioDoc ? custodioDoc.nombre : null;

      const operarioDoc = store.tecnicos.find(t => t.id === Number(activo.id_usuario_operario));
      const operario_nombre = operarioDoc ? operarioDoc.nombre : null;

      // Subir fotos
      if (activo.foto_lateral_anterior) activo.foto_lateral_anterior = await uploadImage(activo.foto_lateral_anterior, 'activos');
      if (activo.foto_lateral_actual) activo.foto_lateral_actual = await uploadImage(activo.foto_lateral_actual, 'activos');
      if (activo.foto_superior_anterior) activo.foto_superior_anterior = await uploadImage(activo.foto_superior_anterior, 'activos');
      if (activo.foto_superior_actual) activo.foto_superior_actual = await uploadImage(activo.foto_superior_actual, 'activos');

      const updateData = {
        modelo: activo.modelo || null,
        marca: activo.marca || null,
        procedencia: activo.procedencia || null,
        capacidad: activo.capacidad || null,
        potencia_hp: activo.potencia_hp || null,
        cilindrada_cm3: activo.cilindrada_cm3 || null,
        motor: activo.motor || null,
        peso_kg: activo.peso_kg || null,
        longitud_espada: activo.longitud_espada || null,
        cadena: activo.cadena || null,
        paso_cadena: activo.paso_cadena || null,
        fecha_adquisicion: activo.fecha_adquisicion || null,
        numero_chasis: activo.numero_chasis,
        codigo_activo: activo.codigo_activo,
        estado: activo.estado || 'Bueno',
        uso: activo.uso || 'Moderado',
        ubicacion_actual: activo.ubicacion_actual || 'Almacén',
        id_custodio: activo.id_custodio || null,
        id_usuario_operario: activo.id_usuario_operario || null,
        observaciones: activo.observaciones || null,
        foto_lateral_anterior: activo.foto_lateral_anterior || null,
        foto_lateral_actual: activo.foto_lateral_actual || null,
        foto_superior_anterior: activo.foto_superior_anterior || null,
        foto_superior_actual: activo.foto_superior_actual || null,
        custodio_nombre,
        operario_nombre
      };

      await updateDoc(docRef, updateData);

      await registrarAuditoria({
        accion: 'MODIFICAR',
        tabla_afectada: 'inventario_activos',
        registro_id: String(id),
        detalles: { codigo_activo: updateData.codigo_activo, estado: updateData.estado }
      });

      return { success: true };
    } catch (error) {
      console.error("Error al modificar activo:", error);
      return { success: false, error: error.message };
    }
  }

  async function fetchInventarioConsumibles() {
    // Sincronizado en tiempo real
  }

  async function fetchInventarioMovimientos() {
    // Sincronizado en tiempo real
  }

  async function addInventarioMovimiento(movimiento) {
    try {
      const qty = Number(movimiento.cantidad);
      const itemId = String(movimiento.id_item);
      const origen = movimiento.origen;
      const destino = movimiento.destino;

      const itemDoc = store.inventarioItems.find(i => i.id_item === itemId);
      if (!itemDoc) throw new Error('El ítem no existe en el catálogo.');
      const itemTipo = itemDoc.tipo;

      const recibeDoc = store.tecnicos.find(t => t.id === Number(movimiento.id_recibe));
      const recibe_nombre = recibeDoc ? recibeDoc.nombre : null;

      const activoDoc = store.inventarioActivos.find(a => a.id_activo === String(movimiento.id_activo_destino));
      const activo_codigo = activoDoc ? activoDoc.codigo_activo : null;
      const activo_modelo = activoDoc ? activoDoc.modelo : null;

      // Actualizar stocks en una transacción
      await runTransaction(db, async (transaction) => {
        const q = query(collection(db, 'inventario_consumibles'), where('id_item', '==', itemId));
        const consumibleSnap = await getDocs(q);
        if (consumibleSnap.empty) throw new Error('Stock no inicializado para este ítem.');
        
        const consumibleDoc = consumibleSnap.docs[0];
        const stockData = consumibleDoc.data();

        let colOrigen = '';
        if (origen === 'Almacén') colOrigen = 'cantidad_almacen';
        else if (origen === 'Oficina') colOrigen = 'cantidad_oficina';
        else if (origen === 'Técnico') colOrigen = 'cantidad_tecnicos';

        let colDestino = '';
        if (destino === 'Almacén') colDestino = 'cantidad_almacen';
        else if (destino === 'Oficina') colDestino = 'cantidad_oficina';
        else if (destino === 'Técnico') colDestino = 'cantidad_tecnicos';

        if (movimiento.tipo_movimiento !== 'Ingreso') {
          const availableStock = Number(stockData[colOrigen] || 0);
          if (availableStock < qty) {
            throw new Error(`Stock insuficiente en ${origen}. Disponible: ${availableStock}, Solicitado: ${qty}`);
          }
          transaction.update(consumibleDoc.ref, {
            [colOrigen]: availableStock - qty
          });
        }

        const currentDestStock = Number(stockData[colDestino] || 0);
        transaction.update(consumibleDoc.ref, {
          [colDestino]: currentDestStock + qty
        });
      });

      let estadoDevolucion = 'No aplica';
      if (itemTipo === 'Repuesto' && movimiento.tipo_movimiento === 'Entrega') {
        estadoDevolucion = 'Pendiente devolución';
      }

      const docRef = doc(collection(db, 'inventario_movimientos'));
      const id_movimiento = Date.now();
      const insertMov = {
        id_movimiento: id_movimiento,
        id_item: itemId,
        cantidad: qty,
        tipo_movimiento: movimiento.tipo_movimiento,
        origen: origen,
        destino: destino,
        id_recibe: movimiento.id_recibe || null,
        id_activo_destino: movimiento.id_activo_destino || null,
        estado_devolucion: estadoDevolucion,
        fecha_movimiento: movimiento.fecha_movimiento || new Date().toISOString().split('T')[0],
        fecha_devolucion: null,
        observaciones: movimiento.observaciones || null,
        item_nombre: itemDoc.nombre,
        item_tipo: itemTipo,
        recibe_nombre,
        activo_codigo,
        activo_modelo
      };

      await setDoc(docRef, insertMov);

      await registrarAuditoria({
        accion: 'CREAR',
        tabla_afectada: 'inventario_movimientos',
        registro_id: String(id_movimiento),
        detalles: { tipo_movimiento: movimiento.tipo_movimiento, cantidad: qty }
      });

      return { success: true };
    } catch (error) {
      console.error("Error al registrar movimiento:", error);
      return { success: false, error: error.message };
    }
  }

  async function updateEstadoDevolucion(id, datos) {
    try {
      const qMov = query(collection(db, 'inventario_movimientos'), where('id_movimiento', '==', Number(id)));
      const movSnap = await getDocs(qMov);
      if (movSnap.empty) throw new Error('Movimiento no encontrado.');

      const movDoc = movSnap.docs[0];
      const mov = movDoc.data();

      const qty = Number(mov.cantidad);
      const itemId = String(mov.id_item);

      await runTransaction(db, async (transaction) => {
        transaction.update(movDoc.ref, {
          estado_devolucion: datos.estado_devolucion,
          fecha_devolucion: datos.fecha_devolucion || new Date().toISOString().split('T')[0]
        });

        if (mov.estado_devolucion === 'Pendiente devolución' && 
            (datos.estado_devolucion === 'Devuelto a Oficina' || datos.estado_devolucion === 'Devuelto a Almacén')) {
          
          const qStock = query(collection(db, 'inventario_consumibles'), where('id_item', '==', itemId));
          const stockSnap = await getDocs(qStock);
          if (!stockSnap.empty) {
            const stockDoc = stockSnap.docs[0];
            const stockData = stockDoc.data();
            const currentTechQty = Number(stockData.cantidad_tecnicos || 0);
            transaction.update(stockDoc.ref, {
              cantidad_tecnicos: Math.max(0, currentTechQty - qty)
            });
          }
        }
      });

      await registrarAuditoria({
        accion: 'MODIFICAR',
        tabla_afectada: 'inventario_movimientos',
        registro_id: String(id),
        detalles: { estado_devolucion: datos.estado_devolucion, fecha_devolucion: datos.fecha_devolucion }
      });

      return { success: true };
    } catch (error) {
      console.error("Error al actualizar devolución:", error);
      return { success: false, error: error.message };
    }
  }

  async function addMantenimientoActivo(mantenimiento) {
    try {
      const docRef = doc(collection(db, 'inventario_mantenimientos'));
      const id_mantenimiento = Date.now();
      
      const insertData = {
        id_mantenimiento: id_mantenimiento,
        id_activo: String(mantenimiento.id_activo),
        fecha_registro: new Date().toISOString().split('T')[0],
        fecha_mantenimiento: mantenimiento.fecha_mantenimiento || new Date().toISOString().split('T')[0],
        observaciones: mantenimiento.observaciones || null,
        detalles: mantenimiento.detalles || []
      };

      await setDoc(docRef, insertData);

      await registrarAuditoria({
        accion: 'CREAR',
        tabla_afectada: 'inventario_mantenimientos',
        registro_id: String(id_mantenimiento),
        detalles: { id_activo: mantenimiento.id_activo }
      });

      return { success: true };
    } catch (error) {
      console.error("Error al registrar mantenimiento:", error);
      return { success: false, error: error.message };
    }
  }

  async function fetchMantenimientosActivo(id) {
    try {
      const q = query(
        collection(db, 'inventario_mantenimientos'), 
        where('id_activo', '==', String(id)),
        orderBy('fecha_mantenimiento', 'desc')
      );
      const querySnap = await getDocs(q);
      const list = [];
      querySnap.forEach(docSnap => {
        list.push(docSnap.data());
      });
      return list;
    } catch (error) {
      console.error("Error al obtener mantenimientos del activo:", error);
      return [];
    }
  }

  async function fetchRepuestosActivo(id) {
    try {
      const q = query(
        collection(db, 'inventario_movimientos'), 
        where('id_activo_destino', '==', String(id)),
        orderBy('fecha_movimiento', 'desc')
      );
      const querySnap = await getDocs(q);
      const list = [];
      querySnap.forEach(docSnap => {
        list.push(docSnap.data());
      });
      return list;
    } catch (error) {
      console.error("Error al obtener repuestos del activo:", error);
      return [];
    }
  }

  return {
    store,
    uiState,
    toast,
    getAuthHeaders,
    showToast,
    login,
    loginWithGoogle,
    changeOwnPassword,
    logout,
    fetchCatalogos,
    fetchConfig,
    updateConfig,
    compressImage,
    fetchImpresiones,
    registrarImpresion,
    deleteImpresion,
    updateImpresionName,
    fetchPublicUsuarios,
    fetchUsuarios,
    addUsuario,
    deleteUsuario,
    updateUsuario,
    restablecerPasswordPorCorreo,
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
    deleteCalendarioEvento,
    fetchAuditoria,
    fetchInventarioItems,
    addInventarioItem,
    updateInventarioItem,
    deleteInventarioItem,
    fetchInventarioActivos,
    addInventarioActivo,
    updateInventarioActivo,
    fetchInventarioConsumibles,
    fetchInventarioMovimientos,
    addInventarioMovimiento,
    updateEstadoDevolucion,
    addMantenimientoActivo,
    fetchMantenimientosActivo,
    fetchRepuestosActivo,
    responsableArea,
    jefeUnidad
  };
});
