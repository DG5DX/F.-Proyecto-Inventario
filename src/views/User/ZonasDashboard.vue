<template>
    <q-page class="page-bg q-pa-md q-pa-sm-xs">

        <!-- ── Header ──────────────────────────────────────────────── -->
        <div class="row items-center q-mb-md q-gutter-sm">
            <div class="row items-center col-12 col-sm-auto">
                <div class="header-icon-wrap q-mr-sm">
                    <q-icon name="view_module" size="20px" color="white"/>
                </div>
                <div>
                    <div class="text-h6 text-weight-bold text-dark lh-tight">Catálogo de Inventario</div>
                    <div class="text-caption text-grey-6">Selecciona una sede para explorar sus ambientes</div>
                </div>
            </div>
        </div>

        <!-- ── Filtro búsqueda ──────────────────────────────────────── -->
        <q-card flat class="filter-card q-mb-md">
            <q-card-section class="q-py-sm">
                <q-input
                    v-model="searchQuery"
                    outlined dense clearable
                    placeholder="Buscar sede por nombre..."
                    bg-color="white"
                    @clear="searchQuery = ''"
                >
                    <template v-slot:prepend><q-icon name="search" color="primary"/></template>
                </q-input>
            </q-card-section>
        </q-card>

        <!-- ── Loading ───────────────────────────────────────────────── -->
        <div v-if="loading" class="text-center q-py-xl">
            <q-spinner-dots size="56px" color="primary"/>
            <div class="text-body2 text-grey-6 q-mt-md">Cargando sedes...</div>
        </div>

        <!-- ── Error ────────────────────────────────────────────────── -->
        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="56px" color="negative" class="q-mb-md"/>
            <div class="text-body1 text-negative">{{ error }}</div>
            <q-btn color="primary" label="Reintentar" @click="loadZones" class="q-mt-md" unelevated/>
        </div>

        <!-- ── Empty ────────────────────────────────────────────────── -->
        <div v-else-if="filteredZones.length === 0" class="text-center q-py-xl">
            <q-icon name="search_off" size="56px" color="grey-4" class="q-mb-md"/>
            <div class="text-body1 text-grey-6">
                {{ searchQuery ? `No se encontraron sedes con "${searchQuery}"` : 'No hay sedes disponibles' }}
            </div>
            <div class="text-caption text-grey-5 q-mt-xs">
                {{ searchQuery ? 'Intenta con otra búsqueda' : 'Contacta al administrador para agregar sedes' }}
            </div>
        </div>

        <!-- ── Grid de sedes ─────────────────────────────────────────── -->
        <div v-else class="row q-col-gutter-md">
            <div
                v-for="zone in filteredZones"
                :key="zone._id"
                class="col-12 col-sm-6 col-md-4 col-lg-3"
            >
                <q-card class="zone-card cursor-pointer" @click="goToClassrooms(zone)">
                    <div class="zone-card-header" :style="{ background: getZoneColor(zone) }">
                        <div class="zone-icon-wrap">
                            <q-icon name="apartment" size="28px" color="white"/>
                        </div>
                        <div class="zone-title">{{ zone.nombre }}</div>
                    </div>
                    <q-card-section class="q-pa-md">
                        <div class="text-caption text-grey-6 desc-clamp">
                            {{ zone.descripcion || 'Sin descripción' }}
                        </div>
                    </q-card-section>
                    <q-separator/>
                    <q-card-actions class="q-pa-sm" align="right">
                        <q-btn flat color="primary" icon-right="chevron_right" label="Ver ambientes" dense no-caps size="sm"/>
                    </q-card-actions>
                </q-card>
            </div>
        </div>

    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { zonesService } from '../../services/items.js';

const router = useRouter();
const $q = useQuasar();

const zones = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');

const filteredZones = computed(() => {
    if (!searchQuery.value) return zones.value;
    const query = searchQuery.value.toLowerCase();
    return zones.value.filter(z =>
        z.nombre.toLowerCase().includes(query) ||
        (z.descripcion && z.descripcion.toLowerCase().includes(query))
    );
});

const loadZones = async () => {
    loading.value = true;
    error.value = null;
    try {
        zones.value = await zonesService.getAll();
    } catch (err) {
        console.error('Error cargando sedes:', err);
        error.value = 'Error al cargar las sedes. Por favor, intenta nuevamente.';
        $q.notify({ type: 'negative', message: 'No se pudieron cargar las sedes', position: 'top', icon: 'error', timeout: 3000 });
    } finally {
        loading.value = false;
    }
};

const goToClassrooms = (zone) => {
    router.push({ name: 'user.classrooms', query: { zona: zone._id, zonaNombre: zone.nombre } });
};

const getZoneColor = (zone) => {
    const colors = [
        'linear-gradient(135deg, #1a4f00, #39A900)',
        'linear-gradient(135deg, #2d8600, #2d8600)',
        'linear-gradient(135deg, #2d8600, #39A900)',
        'linear-gradient(135deg, #39A900, #39A900)',
        'linear-gradient(135deg, #F4A010, #F4A010)',
        'linear-gradient(135deg, #c62020, #dc2626)',
        'linear-gradient(135deg, #e08800, #F4A010)',
        'linear-gradient(135deg, #2d8600, #39A900)',
    ];
    return colors[zone._id.charCodeAt(zone._id.length - 1) % colors.length];
};

onMounted(() => loadZones());
</script>

<style scoped>
.page-bg { background: #f5f5f5; }

.header-icon-wrap {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #1a4f00, #39A900);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; box-shadow: 0 2px 8px rgba(57,169,0,.3);
}
.lh-tight { line-height: 1.2; }

.filter-card {
    border-radius: 10px; border: 1px solid #e0e0e0;
    box-shadow: 0 1px 4px rgba(0,0,0,.05); background: #fafafa;
}

.zone-card {
    border-radius: 12px; overflow: hidden;
    border: 1px solid #e0e0e0;
    box-shadow: 0 2px 8px rgba(0,0,0,.07);
    transition: transform .2s, box-shadow .2s;
}
.zone-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,.13);
}
.zone-card-header {
    padding: 20px 18px 16px;
    display: flex; flex-direction: column; gap: 10px;
}
.zone-icon-wrap {
    width: 44px; height: 44px; border-radius: 12px;
    background: rgba(255,255,255,.2);
    display: flex; align-items: center; justify-content: center;
}
.zone-title {
    color: white; font-size: 16px; font-weight: 700;
    line-height: 1.2;
}
.desc-clamp {
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; min-height: 2.8em;
}

@media (max-width: 599px) {
    .page-bg { padding: 10px 8px !important; }
}
</style>