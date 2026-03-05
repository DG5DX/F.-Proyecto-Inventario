<template>
    <q-page class="page-bg q-pa-md q-pa-sm-xs">

        <!-- ── Breadcrumb ───────────────────────────────────────────── -->
        <q-breadcrumbs class="q-mb-md" active-color="primary">
            <q-breadcrumbs-el label="Sedes" icon="view_module" to="/user/zones" class="cursor-pointer text-grey-6"/>
            <q-breadcrumbs-el :label="zonaNombre || 'Sede'" icon="category" class="text-primary text-weight-medium"/>
        </q-breadcrumbs>

        <!-- ── Header ──────────────────────────────────────────────── -->
        <div class="row items-center q-mb-md q-gutter-sm">
            <div class="row items-center col-12 col-sm-auto">
                <q-btn icon="arrow_back" flat round dense color="primary"
                    @click="router.push('/user/zones')" class="q-mr-xs">
                    <q-tooltip>Volver a Sedes</q-tooltip>
                </q-btn>
                <div class="header-icon-wrap q-mr-sm">
                    <q-icon name="meeting_room" size="20px" color="white"/>
                </div>
                <div>
                    <div class="text-h6 text-weight-bold text-dark lh-tight">{{ zonaNombre || 'Sede' }}</div>
                    <div class="text-caption text-grey-6">Selecciona un ambiente para ver su inventario</div>
                </div>
            </div>
            <q-space class="gt-xs"/>
            <q-btn outline color="primary" icon="refresh" dense no-caps
                @click="loadClassrooms" :loading="loading" class="action-btn">
                Actualizar
            </q-btn>
        </div>

        <!-- ── Stat chips ───────────────────────────────────────────── -->
        <div v-if="classrooms.length > 0" class="row q-col-gutter-sm q-mb-md">
            <div class="col-6 col-sm-3">
                <div class="stat-chip stat-chip--blue">
                    <q-icon name="meeting_room" size="18px"/>
                    <div>
                        <div class="stat-number">{{ filteredClassrooms.length }}</div>
                        <div class="stat-label">Ambientes</div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-sm-3">
                <div class="stat-chip stat-chip--green">
                    <q-icon name="inventory_2" size="18px"/>
                    <div>
                        <div class="stat-number">{{ totalItems }}</div>
                        <div class="stat-label">Ítems total</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Filtro búsqueda ──────────────────────────────────────── -->
        <q-card flat class="filter-card q-mb-md">
            <q-card-section class="q-py-sm">
                <q-input v-model="searchQuery" outlined dense clearable
                    placeholder="Buscar ambiente por nombre..." bg-color="white"
                    @clear="searchQuery = ''">
                    <template v-slot:prepend><q-icon name="search" color="primary"/></template>
                </q-input>
            </q-card-section>
        </q-card>

        <!-- ── Loading ───────────────────────────────────────────────── -->
        <div v-if="loading" class="text-center q-py-xl">
            <q-spinner-dots size="56px" color="primary"/>
            <div class="text-body2 text-grey-6 q-mt-md">Cargando ambientes...</div>
        </div>

        <!-- ── Error ────────────────────────────────────────────────── -->
        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="56px" color="negative" class="q-mb-md"/>
            <div class="text-body1 text-negative">{{ error }}</div>
            <q-btn color="primary" label="Reintentar" @click="loadClassrooms" class="q-mt-md" unelevated/>
        </div>

        <!-- ── Empty ────────────────────────────────────────────────── -->
        <div v-else-if="filteredClassrooms.length === 0" class="text-center q-py-xl">
            <q-icon name="search_off" size="56px" color="grey-4" class="q-mb-md"/>
            <div class="text-body1 text-grey-6">
                {{ searchQuery ? `Sin resultados para "${searchQuery}"` : 'No hay ambientes en esta sede' }}
            </div>
            <q-btn color="primary" label="Volver a Sedes" icon="arrow_back" class="q-mt-md" unelevated
                @click="router.push('/user/zones')"/>
        </div>

        <!-- ── Lista de ambientes ────────────────────────────────────── -->
        <q-card v-else class="aulas-card" flat>
            <q-list separator>
                <q-item
                    v-for="(aula, index) in filteredClassrooms"
                    :key="aula._id"
                    class="aula-item q-py-md"
                    clickable v-ripple
                    @click="goToItems(aula)"
                >
                    <q-item-section avatar>
                        <div class="aula-avatar" :style="{ background: getAulaGradient(index) }">
                            <q-icon name="meeting_room" size="22px" color="white"/>
                        </div>
                    </q-item-section>

                    <q-item-section>
                        <q-item-label class="text-weight-bold text-dark">{{ aula.nombre }}</q-item-label>
                        <q-item-label caption class="text-grey-6">{{ aula.descripcion || 'Sin descripción' }}</q-item-label>
                        <q-item-label caption class="q-mt-xs">
                            <q-icon name="inventory_2" size="xs" class="q-mr-xs text-primary"/>
                            <span class="text-primary text-weight-medium">{{ aula.itemsCount || 0 }}</span>
                            <span class="text-grey-6"> ítem(s) registrado(s)</span>
                        </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                        <div class="column items-end q-gutter-xs">
                            <span class="items-badge" :class="aula.itemsCount > 0 ? 'items-badge--active' : 'items-badge--empty'">
                                {{ aula.itemsCount > 0 ? 'Con ítems' : 'Vacío' }}
                            </span>
                            <q-icon name="chevron_right" color="grey-5" size="20px"/>
                        </div>
                    </q-item-section>
                </q-item>
            </q-list>
        </q-card>

    </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { itemsService, classroomsService } from '../../services/items.js';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const classrooms = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');

const zonaId = computed(() => route.query.zona);
const zonaNombre = computed(() => route.query.zonaNombre);

const filteredClassrooms = computed(() => {
    if (!searchQuery.value) return classrooms.value;
    const query = searchQuery.value.toLowerCase();
    return classrooms.value.filter(a =>
        a.nombre.toLowerCase().includes(query) ||
        (a.descripcion && a.descripcion.toLowerCase().includes(query))
    );
});

const totalItems = computed(() =>
    filteredClassrooms.value.reduce((sum, a) => sum + (a.itemsCount || 0), 0)
);

const loadClassrooms = async () => {
    loading.value = true;
    error.value = null;
    try {
        const [aulasData, itemsData] = await Promise.all([
            classroomsService.getAll({ zona: zonaId.value }),
            itemsService.getAll({ zona: zonaId.value })
        ]);
        const countMap = new Map();
        itemsData.forEach(item => {
            if (item.aula?._id) countMap.set(item.aula._id, (countMap.get(item.aula._id) || 0) + 1);
        });
        classrooms.value = aulasData
            .map(a => ({ ...a, itemsCount: countMap.get(a._id) || 0 }))
            .sort((a, b) => b.itemsCount - a.itemsCount);
    } catch (err) {
        console.error('Error cargando ambientes:', err);
        error.value = 'Error al cargar los ambientes. Por favor, intenta nuevamente.';
        $q.notify({ type: 'negative', message: 'No se pudieron cargar los ambientes', position: 'top', icon: 'error', timeout: 3000 });
    } finally {
        loading.value = false;
    }
};

const goToItems = (aula) => {
    router.push({ name: 'user.items', query: { zona: zonaId.value, zonaNombre: zonaNombre.value, aula: aula._id, aulaNombre: aula.nombre } });
};

const getAulaGradient = (index) => {
    const gradients = [
        'linear-gradient(135deg, #1a4f00, #39A900)',
        'linear-gradient(135deg, #2d8600, #2d8600)',
        'linear-gradient(135deg, #2d8600, #39A900)',
        'linear-gradient(135deg, #39A900, #39A900)',
        'linear-gradient(135deg, #F4A010, #F4A010)',
        'linear-gradient(135deg, #c62020, #dc2626)',
    ];
    return gradients[index % gradients.length];
};

const validateZone = () => {
    if (!zonaId.value) {
        $q.notify({ type: 'warning', message: 'No se ha seleccionado una sede', position: 'top', timeout: 2000 });
        router.push('/user/zones');
    }
};

watch(() => zonaId.value, (newVal) => { if (newVal) loadClassrooms(); });
onMounted(() => { validateZone(); if (zonaId.value) loadClassrooms(); });
</script>

<style scoped>
.page-bg { background: #f5f5f5; }

.header-icon-wrap {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #2d8600, #2d8600);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; box-shadow: 0 2px 8px rgba(14,116,144,.3);
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
.stat-number { font-size: 20px; font-weight: 700; line-height: 1; }
.stat-label  { font-size: 11px; font-weight: 500; opacity: .8; }

.filter-card {
    border-radius: 10px; border: 1px solid #e0e0e0;
    box-shadow: 0 1px 4px rgba(0,0,0,.05); background: #fafafa;
}

.aulas-card {
    border-radius: 14px; border: 1px solid #e0e0e0;
    overflow: hidden; box-shadow: 0 1px 8px rgba(0,0,0,.06);
}
.aula-item { transition: background .12s; }
.aula-item:hover { background: #f5fbf0 !important; }

.aula-avatar {
    width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,.15);
}

.items-badge {
    display: inline-block; padding: 2px 8px; border-radius: 20px;
    font-size: 11px; font-weight: 600;
}
.items-badge--active { background: #eaf7d8; color: #2d8600; }
.items-badge--empty  { background: #f0f0f0; color: #9e9e9e; }

@media (max-width: 599px) {
    .page-bg { padding: 10px 8px !important; }
    .stat-number { font-size: 17px; }
}
</style>