import { reactive, computed } from 'vue';

const STORAGE_PREFIX = 'loan_cart_';

// Obtiene la clave de storage para el usuario actual
const getStorageKey = () => {
    const userId = localStorage.getItem('userId');
    return userId ? `${STORAGE_PREFIX}${userId}` : `${STORAGE_PREFIX}guest`;
};

const loadFromStorage = (key) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const state = reactive({
    items: loadFromStorage(getStorageKey()),
    storageKey: getStorageKey(),
});

const persist = () => {
    try {
        localStorage.setItem(state.storageKey, JSON.stringify(state.items));
    } catch { /* silent */ }
};

/**
 * Reinicializa el carrito para el usuario indicado.
 * Se llama al hacer login para cargar el carrito del usuario correcto.
 */
const initForUser = (userId) => {
    const key = userId ? `${STORAGE_PREFIX}${userId}` : `${STORAGE_PREFIX}guest`;
    state.storageKey = key;
    const stored = loadFromStorage(key);
    state.items.splice(0, state.items.length, ...stored);
};

/**
 * Limpia el carrito en memoria sin borrar el storage del usuario.
 * Se llama al hacer logout para que el próximo usuario no vea los ítems del anterior.
 */
const clearCartMemory = () => {
    state.items.splice(0, state.items.length);
    state.storageKey = `${STORAGE_PREFIX}guest`;
};

const totalItems   = computed(() => state.items.length);
const totalUnidades = computed(() => state.items.reduce((s, e) => s + e.cantidad, 0));
const isEmpty      = computed(() => state.items.length === 0);

/**
 * Ambiente (aula) al que pertenecen todos los ítems del préstamo.
 * undefined si el préstamo está vacío.
 * Se usa para bloquear ítems de otros ambientes.
 */
const cartAulaId = computed(() => {
    if (state.items.length === 0) return undefined;
    return state.items[0].item.aula?._id || state.items[0].item.aula;
});

const cartAulaNombre = computed(() => {
    if (state.items.length === 0) return undefined;
    return state.items[0].item.aula?.nombre || undefined;
});

const cartZonaId = computed(() => {
    if (state.items.length === 0) return undefined;
    return state.items[0].item.zona?._id || state.items[0].item.zona;
});

const cartZonaNombre = computed(() => {
    if (state.items.length === 0) return undefined;
    return state.items[0].item.zona?.nombre || undefined;
});

// Mutaciones

/**
 * Añade o actualiza un ítem en el préstamo.
 * Si ya existe, suma la cantidad (respetando el máximo disponible).
 * Retorna 'added' | 'updated' | 'wrong_aula' (si el ítem es de otro ambiente).
 */
const addItem = (item, cantidad = 1, observacion = '') => {
    if (state.items.length > 0) {
        const itemAulaId = item.aula?._id || item.aula;
        const currentAulaId = cartAulaId.value;
        if (itemAulaId !== currentAulaId) {
            return 'wrong_aula';
        }
    }

    const idx = state.items.findIndex(e => e.item._id === item._id);
    if (idx !== -1) {
        const entry = state.items[idx];
        const nuevaCantidad = entry.cantidad + cantidad;
        entry.cantidad = Math.min(nuevaCantidad, item.cantidad_disponible);
        entry.observacion = observacion || entry.observacion;
        persist();
        return 'updated';
    }
    state.items.push({
        item: { ...item },   // snapshot del ítem al momento de añadir
        cantidad: Math.min(cantidad, item.cantidad_disponible),
        observacion,
    });
    persist();
    return 'added';
};

/**
 * Actualiza la cantidad de un ítem existente.
 * Si cantidad <= 0 elimina el ítem.
 */
const updateCantidad = (itemId, cantidad) => {
    const idx = state.items.findIndex(e => e.item._id === itemId);
    if (idx === -1) return;
    if (cantidad <= 0) {
        state.items.splice(idx, 1);
    } else {
        state.items[idx].cantidad = Math.min(cantidad, state.items[idx].item.cantidad_disponible);
    }
    persist();
};

const updateObservacion = (itemId, observacion) => {
    const entry = state.items.find(e => e.item._id === itemId);
    if (entry) {
        entry.observacion = observacion;
        persist();
    }
};

const removeItem = (itemId) => {
    const idx = state.items.findIndex(e => e.item._id === itemId);
    if (idx !== -1) {
        state.items.splice(idx, 1);
        persist();
    }
};

const clearCart = () => {
    state.items.splice(0, state.items.length);
    persist();
};

const hasItem  = (itemId) => state.items.some(e => e.item._id === itemId);
const getEntry = (itemId) => state.items.find(e => e.item._id === itemId);

// Export 
export const useLoanCart = () => ({
    items: state.items,
    totalItems,
    totalUnidades,
    isEmpty,
    cartAulaId,
    cartAulaNombre,
    cartZonaId,
    cartZonaNombre,
    addItem,
    updateCantidad,
    updateObservacion,
    removeItem,
    clearCart,
    clearCartMemory,
    initForUser,
    hasItem,
    getEntry,
});