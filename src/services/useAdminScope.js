/**
 * useAdminScope.js
 *
 * Composable que expone el scope del usuario autenticado.
 *
 * - isSuperAdmin      : true si rol === 'SuperAdmin'
 * - isAdmin           : true si rol === 'Admin'
 * - aulasPermitidas   : objetos aula asignados (con zona populada). null si SuperAdmin.
 * - zonasPermitidas   : zonas padre de esas aulas, sin duplicados. null si SuperAdmin.
 * - canManageAula(id) : true si el usuario puede actuar sobre esa aula
 * - filtrarAulas(arr) : filtra un array de aulas por el scope del usuario
 * - filtrarZonas(arr) : filtra un array de zonas por el scope del usuario
 *
 * La carga se hace UNA sola vez por sesión (cache a nivel de módulo).
 * Llamar resetScope() al hacer logout.
 */

import { ref, computed } from 'vue';
import api from './api.js';

// ── Cache de módulo ───────────────────────────────────────────────────────────
const _aulasAsignadas = ref([]);
const _loaded         = ref(false);
const _loading        = ref(false);

const _rol = () => localStorage.getItem('userRol') || 'Comun';

// ── Composable ────────────────────────────────────────────────────────────────
export const useAdminScope = () => {

    const isSuperAdmin = computed(() => _rol() === 'SuperAdmin');
    const isAdmin      = computed(() => _rol() === 'Admin');

    /**
     * Carga el scope desde /auth/me.
     * Solo hace fetch si rol === 'Admin' y no se ha cargado aún.
     */
    const loadScope = async () => {
        if (_loaded.value || _loading.value) return;
        if (_rol() !== 'Admin') { _loaded.value = true; return; }

        _loading.value = true;
        try {
            const { data } = await api.get('/auth/me');
            // /auth/me popula ambientes_asignados con { _id, nombre, zona: { _id, nombre } }
            _aulasAsignadas.value = Array.isArray(data.ambientes_asignados)
                ? data.ambientes_asignados
                : [];
        } catch (err) {
            console.error('[useAdminScope] Error:', err.message);
            _aulasAsignadas.value = [];
        } finally {
            _loaded.value  = true;
            _loading.value = false;
        }
    };

    /** Invalida el cache — llamar al hacer logout */
    const resetScope = () => {
        _aulasAsignadas.value = [];
        _loaded.value  = false;
        _loading.value = false;
    };

    /**
     * Objetos aula asignados al Admin (con zona populada).
     * null para SuperAdmin (sin restricción, carga todo normalmente).
     */
    const aulasPermitidas = computed(() => {
        if (_rol() === 'SuperAdmin') return null;
        return _aulasAsignadas.value;
    });

    /**
     * Zonas padre de las aulas asignadas, sin duplicados.
     * null para SuperAdmin.
     */
    const zonasPermitidas = computed(() => {
        if (_rol() === 'SuperAdmin') return null;
        const visto = new Map();
        for (const aula of _aulasAsignadas.value) {
            const zona = aula.zona;
            if (!zona) continue;
            const id = String(zona._id || zona);
            if (!visto.has(id))
                visto.set(id, typeof zona === 'object' ? zona : { _id: id, nombre: id });
        }
        return [...visto.values()];
    });

    /** true si el usuario puede gestionar esa aula */
    const canManageAula = (aulaId) => {
        if (_rol() === 'SuperAdmin') return true;
        if (_rol() !== 'Admin') return false;
        return _aulasAsignadas.value.some(a => String(a._id || a) === String(aulaId));
    };

    /**
     * Filtra un array de aulas según el scope.
     * SuperAdmin recibe el array completo intacto.
     */
    const filtrarAulas = (todasLasAulas) => {
        if (_rol() === 'SuperAdmin') return todasLasAulas;
        const ids = new Set(_aulasAsignadas.value.map(a => String(a._id || a)));
        return todasLasAulas.filter(a => ids.has(String(a._id)));
    };

    /**
     * Filtra un array de zonas dejando solo las que tienen
     * al menos un ambiente en el scope del Admin.
     */
    const filtrarZonas = (todasLasZonas) => {
        if (_rol() === 'SuperAdmin') return todasLasZonas;
        const zonaIds = new Set(
            _aulasAsignadas.value
                .map(a => String(a.zona?._id || a.zona))
                .filter(Boolean)
        );
        return todasLasZonas.filter(z => zonaIds.has(String(z._id)));
    };

    return {
        isSuperAdmin,
        isAdmin,
        aulasPermitidas,
        zonasPermitidas,
        loaded: _loaded,
        loadScope,
        resetScope,
        canManageAula,
        filtrarAulas,
        filtrarZonas,
    };
};