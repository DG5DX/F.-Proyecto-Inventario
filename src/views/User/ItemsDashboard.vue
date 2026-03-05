<template>
    <q-page class="page-bg q-pa-md q-pa-sm-xs">

        <!-- ── Breadcrumb ───────────────────────────────────────────── -->
        <q-breadcrumbs class="q-mb-md" active-color="primary">
            <q-breadcrumbs-el label="Sedes" icon="view_module" to="/user/zones" class="cursor-pointer text-grey-6"/>
            <q-breadcrumbs-el :label="zonaNombre || 'Sede'" icon="category"
                :to="`/user/classrooms?zona=${zonaId}&zonaNombre=${zonaNombre}`"
                class="cursor-pointer text-grey-6"/>
            <q-breadcrumbs-el :label="aulaNombre || 'Ambiente'" icon="meeting_room" class="text-primary text-weight-medium"/>
        </q-breadcrumbs>

        <!-- ── Header ──────────────────────────────────────────────── -->
        <div class="row items-center q-mb-md q-gutter-sm">
            <div class="row items-center col-12 col-sm-auto">
                <q-btn icon="arrow_back" flat round dense color="primary" @click="goBack" class="q-mr-xs">
                    <q-tooltip>Volver a Ambientes</q-tooltip>
                </q-btn>
                <div class="header-icon-wrap q-mr-sm">
                    <q-icon name="inventory_2" size="20px" color="white"/>
                </div>
                <div>
                    <div class="text-h6 text-weight-bold text-dark lh-tight">{{ aulaNombre || 'Ambiente' }}</div>
                    <div class="text-caption text-grey-6">{{ zonaNombre || 'Sede' }}</div>
                </div>
            </div>
            <q-space class="gt-xs"/>
            <q-btn outline color="primary" icon="refresh" dense no-caps
                @click="loadItems" :loading="loading" class="action-btn">
                Actualizar
            </q-btn>
        </div>

        <!-- ── Stat chips ───────────────────────────────────────────── -->
        <div v-if="items.length > 0" class="row q-col-gutter-sm q-mb-md">
            <div class="col-4">
                <div class="stat-chip stat-chip--blue">
                    <q-icon name="inventory_2" size="18px"/>
                    <div>
                        <div class="stat-number">{{ filteredItems.length }}</div>
                        <div class="stat-label">Total</div>
                    </div>
                </div>
            </div>
            <div class="col-4">
                <div class="stat-chip stat-chip--green">
                    <q-icon name="check_circle" size="18px"/>
                    <div>
                        <div class="stat-number">{{ disponiblesCount }}</div>
                        <div class="stat-label">Disponibles</div>
                    </div>
                </div>
            </div>
            <div class="col-4">
                <div class="stat-chip stat-chip--red">
                    <q-icon name="cancel" size="18px"/>
                    <div>
                        <div class="stat-number">{{ agotadosCount }}</div>
                        <div class="stat-label">Agotados</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Filtros ───────────────────────────────────────────────── -->
        <q-card flat class="filter-card q-mb-md">
            <q-card-section class="q-py-sm">
                <div class="row q-col-gutter-sm">
                    <div class="col-12 col-sm-8">
                        <q-input v-model="searchQuery" outlined dense clearable
                            placeholder="Buscar por nombre..." bg-color="white"
                            @clear="searchQuery = ''">
                            <template v-slot:prepend><q-icon name="search" color="primary"/></template>
                        </q-input>
                    </div>
                    <div class="col-12 col-sm-4">
                        <q-select v-model="categoriaFiltro" outlined dense clearable
                            label="Categoría" bg-color="white"
                            :options="categoriaOptions" emit-value map-options>
                            <template v-slot:prepend><q-icon name="style" color="primary"/></template>
                        </q-select>
                    </div>
                </div>
            </q-card-section>
        </q-card>

        <!-- ── Loading ───────────────────────────────────────────────── -->
        <div v-if="loading" class="text-center q-py-xl">
            <q-spinner-dots size="56px" color="primary"/>
            <div class="text-body2 text-grey-6 q-mt-md">Cargando ítems...</div>
        </div>

        <!-- ── Error ────────────────────────────────────────────────── -->
        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="56px" color="negative" class="q-mb-md"/>
            <div class="text-body1 text-negative">{{ error }}</div>
            <q-btn color="primary" label="Reintentar" @click="loadItems" class="q-mt-md" unelevated/>
        </div>

        <!-- ── Empty ────────────────────────────────────────────────── -->
        <div v-else-if="filteredItems.length === 0" class="text-center q-py-xl">
            <q-icon name="search_off" size="56px" color="grey-4" class="q-mb-md"/>
            <div class="text-body1 text-grey-6">
                {{ searchQuery || categoriaFiltro ? 'Sin resultados con los filtros aplicados' : 'No hay ítems en este ambiente' }}
            </div>
            <q-btn color="primary" label="Volver a Ambientes" icon="arrow_back" class="q-mt-md" unelevated @click="goBack"/>
        </div>

        <!-- ── Grid de ítems ─────────────────────────────────────────── -->
        <div v-else class="row q-col-gutter-md">
            <div
                v-for="item in filteredItems"
                :key="item._id"
                class="col-12 col-sm-6 col-md-4 col-lg-3"
            >
                <q-card class="item-card cursor-pointer" @click="goToItemDetail(item)">
                    <!-- Imagen -->
                    <div class="item-img-container">
                        <q-img
                            :src="item.imagen || ''"
                            height="160px"
                            fit="cover"
                            class="item-img"
                        >
                            <template v-slot:error>
                                <div class="item-img-fallback">
                                    <q-icon name="inventory_2" size="40px" color="grey-4"/>
                                </div>
                            </template>
                        </q-img>
                        <!-- Badge estado flotante -->
                        <span class="estado-badge" :class="item.estado === 'Disponible' ? 'estado-badge--disponible' : 'estado-badge--agotado'">
                            {{ item.estado }}
                        </span>
                        <!-- Stock overlay -->
                        <div class="stock-overlay">
                            <q-icon name="inventory" size="12px"/>
                            {{ item.cantidad_disponible }} / {{ item.cantidad_total_stock }}
                        </div>
                    </div>

                    <q-card-section class="q-pa-sm q-pb-xs">
                        <div class="text-weight-bold text-dark item-name">{{ item.nombre }}</div>
                        <div class="text-caption text-grey-6 q-mt-xs">
                            <q-icon name="category" size="11px" class="q-mr-xs"/>{{ item.zona?.nombre || 'Sin sede' }}
                        </div>
                    </q-card-section>

                    <q-separator/>

                    <q-card-actions class="q-pa-sm" align="between">
                        <span class="cat-badge" :class="getCatBadgeClass(item.tipo_categoria)">
                            {{ item.tipo_categoria }}
                        </span>
                        <q-chip
                            dense size="sm"
                            :color="getStockColor(item)"
                            text-color="white"
                            class="text-caption"
                        >
                            {{ getStockLabel(item) }}
                        </q-chip>
                    </q-card-actions>
                </q-card>
            </div>
        </div>

    </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { itemsService } from '../../services/items.js';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const items = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');
const categoriaFiltro = ref(null);

const categoriaOptions = [
    { label: 'Consumible',        value: 'Consumible' },
    { label: 'De Uso Controlado', value: 'De Uso Controlado' },
    { label: 'Equipo O Maquinaria', value: 'Equipo O Maquinaria' },
];

const zonaId    = computed(() => route.query.zona);
const zonaNombre = computed(() => route.query.zonaNombre);
const aulaId    = computed(() => route.query.aula);
const aulaNombre = computed(() => route.query.aulaNombre);

const filteredItems = computed(() => {
    let result = items.value;
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        result = result.filter(i =>
            i.nombre.toLowerCase().includes(q) ||
            (i.descripcion && i.descripcion.toLowerCase().includes(q))
        );
    }
    if (categoriaFiltro.value) {
        result = result.filter(i => i.tipo_categoria === categoriaFiltro.value);
    }
    return result;
});

const disponiblesCount = computed(() => filteredItems.value.filter(i => i.estado === 'Disponible').length);
const agotadosCount    = computed(() => filteredItems.value.filter(i => i.estado === 'Agotado').length);

const loadItems = async () => {
    loading.value = true;
    error.value = null;
    try {
        items.value = await itemsService.getAll({ zona: zonaId.value, aula: aulaId.value });
    } catch (err) {
        console.error('Error cargando ítems:', err);
        error.value = 'Error al cargar los ítems. Por favor, intenta nuevamente.';
        $q.notify({ type: 'negative', message: 'No se pudieron cargar los ítems', position: 'top', icon: 'error', timeout: 3000 });
    } finally {
        loading.value = false;
    }
};

const goToItemDetail = (item) => {
    router.push({ name: 'user.itemDetail', params: { id: item._id } });
};

const goBack = () => {
    router.push({ name: 'user.classrooms', query: { zona: zonaId.value, zonaNombre: zonaNombre.value } });
};

const getStockColor = (item) => {
    const pct = (item.cantidad_disponible / item.cantidad_total_stock) * 100;
    if (pct === 0)  return 'negative';
    if (pct < 30)   return 'warning';
    if (pct < 70)   return 'info';
    return 'positive';
};

const getStockLabel = (item) => {
    const pct = (item.cantidad_disponible / item.cantidad_total_stock) * 100;
    if (pct === 0)  return 'Sin stock';
    if (pct < 30)   return 'Stock bajo';
    if (pct < 70)   return 'Stock medio';
    return 'Stock alto';
};

const getCatBadgeClass = (tipo) => {
    if (tipo === 'Consumible')        return 'cat-badge--orange';
    if (tipo === 'De Uso Controlado') return 'cat-badge--blue';
    return 'cat-badge--purple';
};

const validateParams = () => {
    if (!zonaId.value || !aulaId.value) {
        $q.notify({ type: 'warning', message: 'Faltan parámetros de navegación', position: 'top', timeout: 2000 });
        router.push('/user/zones');
    }
};

watch([zonaId, aulaId], () => { if (zonaId.value && aulaId.value) loadItems(); });
onMounted(() => { validateParams(); if (zonaId.value && aulaId.value) loadItems(); });
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
.action-btn { border-radius: 8px !important; }

.stat-chip {
    border-radius: 10px; padding: 12px 14px;
    display: flex; align-items: center; gap: 10px;
    border: 2px solid transparent; min-height: 58px;
}
.stat-chip--blue  { background: #f0faf0; color: #39A900; border-color: #d4f0b0; }
.stat-chip--green { background: #f0fdf4; color: #39A900; border-color: #d4f0b0; }
.stat-chip--red   { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
.stat-number { font-size: 20px; font-weight: 700; line-height: 1; }
.stat-label  { font-size: 11px; font-weight: 500; opacity: .8; }

.filter-card {
    border-radius: 10px; border: 1px solid #e0e0e0;
    box-shadow: 0 1px 4px rgba(0,0,0,.05); background: #fafafa;
}

/* ── Item cards ─────────────────────────────────────────────── */
.item-card {
    border-radius: 12px; overflow: hidden;
    border: 1px solid #e0e0e0;
    box-shadow: 0 2px 8px rgba(0,0,0,.07);
    transition: transform .2s, box-shadow .2s;
}
.item-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0,0,0,.13);
}

.item-img-container { position: relative; overflow: hidden; }
.item-img { display: block; }
.item-img-fallback {
    height: 160px; display: flex; align-items: center; justify-content: center;
    background: #f0f0f0;
}

.estado-badge {
    position: absolute; top: 8px; right: 8px;
    padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .3px;
}
.estado-badge--disponible { background: #eaf7d8; color: #2d8600; }
.estado-badge--agotado    { background: #fee2e2; color: #b91c1c; }

.stock-overlay {
    position: absolute; bottom: 6px; left: 8px;
    background: rgba(0,0,0,.55); color: white;
    padding: 2px 8px; border-radius: 20px;
    font-size: 11px; font-weight: 600;
    display: flex; align-items: center; gap: 4px;
}

.item-name {
    font-size: 13.5px; line-height: 1.3;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    min-height: 2.6em;
}

/* ── Category badge ─────────────────────────────────────────── */
.cat-badge {
    display: inline-block; padding: 2px 8px; border-radius: 20px;
    font-size: 10px; font-weight: 600; letter-spacing: .2px;
    max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cat-badge--orange { background: #fff8e6; color: #c2410c; border: 1px solid #fde9a0; }
.cat-badge--blue   { background: #f0faf0; color: #2d8600; border: 1px solid #d4f0b0; }
.cat-badge--purple { background: #f0fae8; color: #1a4f00; border: 1px solid #d4efc0; }

@media (max-width: 599px) {
    .page-bg { padding: 10px 8px !important; }
    .stat-number { font-size: 17px; }
}
</style>