import { reactive, computed, readonly } from 'vue';

// ─── Estado global (singleton) ───────────────────────────────────────────────
const STORAGE_KEY = 'loan_cart_v1';

const loadFromStorage = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const state = reactive({
    items: loadFromStorage(), // [{ item, cantidad, observacion }]
});

const persist = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch { /* silent */ }
};

// ─── Computed ─────────────────────────────────────────────────────────────────
const totalItems = computed(() => state.items.length);
const totalUnidades = computed(() => state.items.reduce((s, e) => s + e.cantidad, 0));
const isEmpty = computed(() => state.items.length === 0);

// ─── Mutaciones ───────────────────────────────────────────────────────────────

/**
 * Añade o actualiza un ítem en el carrito.
 * Si ya existe, suma la cantidad (respetando el máximo disponible).
 * Retorna 'added' | 'updated'.
 */
const addItem = (item, cantidad = 1, observacion = '') => {
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

const hasItem = (itemId) => state.items.some(e => e.item._id === itemId);

const getEntry = (itemId) => state.items.find(e => e.item._id === itemId);

// ─── Export ───────────────────────────────────────────────────────────────────
export const useLoanCart = () => ({
    items: state.items,          // array reactivo (mutable internamente)
    totalItems,
    totalUnidades,
    isEmpty,
    addItem,
    updateCantidad,
    updateObservacion,
    removeItem,
    clearCart,
    hasItem,
    getEntry,
});