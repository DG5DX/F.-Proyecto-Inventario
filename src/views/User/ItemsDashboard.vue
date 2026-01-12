<template>
    <q-page class="q-pa-lg bg-grey-2">
        <!-- Breadcrumbs -->
        <q-breadcrumbs class="text-secondary q-mb-md">
            <q-breadcrumbs-el 
                label="Zonas" 
                icon="view_module" 
                to="/user/zones" 
                class="cursor-pointer"
            />
            <q-breadcrumbs-el 
                :label="categoriaNombre || 'Categoría'" 
                icon="map" 
                :to="`/user/classrooms?categoria=${categoriaId}&categoriaNombre=${categoriaNombre}`" 
                class="cursor-pointer"
            />
            <q-breadcrumbs-el 
                :label="aulaNombre || 'Aula'" 
                icon="meeting_room"
            />
        </q-breadcrumbs>

        <!-- Header con búsqueda y filtros -->
        <div class="row items-center q-mb-lg q-gutter-md">
            <div class="col-12 col-md-6">
                <div class="text-h5 text-weight-bold text-secondary">
                    Inventario en: {{ aulaNombre || 'Aula' }}
                </div>
                <div class="text-caption text-grey-6">
                    {{ categoriaNombre || 'Categoría' }}
                </div>
            </div>
            <q-space />
            <div class="col-12 col-md-auto">
                <q-btn 
                    flat 
                    round 
                    icon="refresh" 
                    color="primary"
                    @click="loadItems"
                    :loading="loading"
                >
                    <q-tooltip>Recargar ítems</q-tooltip>
                </q-btn>
            </div>
        </div>

        <!-- Barra de búsqueda y filtros -->
        <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-12 col-md-8">
                <q-input
                    v-model="searchQuery"
                    filled
                    placeholder="Buscar ítem por nombre..."
                    clearable
                    @clear="searchQuery = ''"
                    bg-color="white"
                >
                    <template v-slot:prepend>
                        <q-icon name="search" />
                    </template>
                </q-input>
            </div>
            <div class="col-12 col-md-4">
                <q-select
                    v-model="estadoFiltro"
                    filled
                    label="Filtrar por Estado"
                    :options="estadoOptions"
                    clearable
                    bg-color="white"
                    color="primary"
                >
                    <template v-slot:prepend>
                        <q-icon name="filter_list" />
                    </template>
                </q-select>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center q-py-xl">
            <q-spinner-dots size="64px" color="primary" />
            <div class="text-h6 text-grey-6 q-mt-md">Cargando ítems...</div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="64px" color="negative" class="q-mb-md"/>
            <div class="text-h6 text-negative">{{ error }}</div>
            <q-btn 
                color="primary" 
                label="Reintentar" 
                @click="loadItems" 
                class="q-mt-md"
            />
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredItems.length === 0" class="text-center q-py-xl">
            <q-icon name="search_off" size="64px" color="accent" class="q-mb-md" />
            <div class="text-h6 text-accent">
                {{ searchQuery || estadoFiltro
                    ? 'No se encontraron ítems que coincidan con los filtros o la búsqueda.' 
                    : 'No hay ítems registrados en esta aula actualmente.' 
                }}
            </div>
            <div class="text-subtitle1 text-grey-6 q-mb-lg">
                {{ searchQuery || estadoFiltro
                    ? 'Intenta limpiando el filtro de estado o modificando la búsqueda.' 
                    : 'Contacta al administrador para agregar ítems.' 
                }}
            </div>
            <q-btn 
                color="primary" 
                label="Volver a Aulas" 
                icon="arrow_back"
                @click="goBack"
            />
        </div>

        <!-- Items Grid -->
        <div v-else>
            <div class="row q-col-gutter-lg">
                <div 
                    v-for="item in filteredItems" 
                    :key="item._id"
                    class="col-12 col-sm-6 col-md-4 col-lg-3"
                >
                    <q-card class="item-card cursor-pointer" @click="goToItemDetail(item)">
                        <q-img 
                            :src="item.imagen || 'https://via.placeholder.com/300x180?text=Sin+Imagen'" 
                            height="180px" 
                            fit="cover"
                        >
                            <q-badge 
                                :color="item.estado === 'Disponible' ? 'positive' : 'negative'" 
                                floating 
                                class="q-px-sm q-py-xs text-caption text-weight-bold"
                            >
                                {{ item.estado }}
                            </q-badge>
                            <div class="absolute-bottom text-subtitle2 text-white bg-transparent q-pa-xs">
                                <q-chip 
                                    dense 
                                    size="sm" 
                                    color="rgba(0,0,0,0.5)" 
                                    text-color="white"
                                    icon="inventory"
                                >
                                    {{ item.cantidad_disponible }} / {{ item.cantidad_total_stock }}
                                </q-chip>
                            </div>
                        </q-img>

                        <q-card-section>
                            <div class="text-subtitle1 text-weight-bold text-dark ellipsis-2-lines">
                                {{ item.nombre }}
                            </div>
                            <div class="text-caption text-grey-7 q-mt-xs">
                                <q-icon name="category" size="xs" class="q-mr-xs"/>
                                {{ item.categoria?.nombre || 'Sin categoría' }}
                            </div>
                            <div class="text-caption text-grey-6 q-mt-sm">
                                <q-icon name="label" size="xs" class="q-mr-xs"/>
                                Tipo: {{ item.tipo_categoria }}
                            </div>
                        </q-card-section>

                        <q-separator />

                        <q-card-actions align="between">
                            <q-chip 
                                :color="getStockColor(item)" 
                                text-color="white" 
                                size="sm"
                                dense
                            >
                                {{ getStockLabel(item) }}
                            </q-chip>
                            <q-btn 
                                flat 
                                icon-right="info" 
                                label="Detalle" 
                                color="primary" 
                                size="sm"
                            />
                        </q-card-actions>
                    </q-card>
                </div>
            </div>

            <!-- Footer con estadísticas -->
            <div class="q-mt-lg text-center">
                <q-chip icon="inventory_2" color="primary" text-color="white">
                    {{ filteredItems.length }} ítem(s) encontrado(s)
                </q-chip>
                <q-chip icon="check_circle" color="positive" text-color="white">
                    {{ disponiblesCount }} disponible(s)
                </q-chip>
                <q-chip icon="cancel" color="negative" text-color="white">
                    {{ agotadosCount }} agotado(s)
                </q-chip>
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

// Estados reactivos
const items = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');
const estadoFiltro = ref(null);

// Opciones para el filtro de estado
const estadoOptions = ['Disponible', 'Agotado'];

// Obtener parámetros de la ruta
const categoriaId = computed(() => route.query.categoria);
const categoriaNombre = computed(() => route.query.categoriaNombre);
const aulaId = computed(() => route.query.aula);
const aulaNombre = computed(() => route.query.aulaNombre);

// Computed para filtrar ítems
const filteredItems = computed(() => {
    let result = items.value;

    // Filtrar por búsqueda
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(item => 
            item.nombre.toLowerCase().includes(query) ||
            (item.descripcion && item.descripcion.toLowerCase().includes(query)) ||
            item.tipo_categoria.toLowerCase().includes(query)
        );
    }

    // Filtrar por estado
    if (estadoFiltro.value) {
        result = result.filter(item => item.estado === estadoFiltro.value);
    }

    return result;
});

// Computed para estadísticas
const disponiblesCount = computed(() => 
    filteredItems.value.filter(item => item.estado === 'Disponible').length
);

const agotadosCount = computed(() => 
    filteredItems.value.filter(item => item.estado === 'Agotado').length
);

// Función para cargar ítems
const loadItems = async () => {
    loading.value = true;
    error.value = null;
    
    try {
        const params = {
            categoria: categoriaId.value,
            aula: aulaId.value
        };

        const data = await itemsService.getAll(params);
        items.value = data;
        
        if (data.length === 0) {
            $q.notify({
                type: 'info',
                message: 'No hay ítems en esta aula',
                position: 'top',
                timeout: 2000
            });
        }
    } catch (err) {
        console.error('Error cargando ítems:', err);
        error.value = 'Error al cargar los ítems. Por favor, intenta nuevamente.';
        
        $q.notify({
            type: 'negative',
            message: 'No se pudieron cargar los ítems',
            position: 'top',
            icon: 'error',
            timeout: 3000
        });
    } finally {
        loading.value = false;
    }
};

// Función para navegar al detalle del ítem
const goToItemDetail = (item) => {
    router.push({
        name: 'user.itemDetail',
        params: { id: item._id }
    });
};

// Función para volver a las aulas
const goBack = () => {
    router.push({
        name: 'user.classrooms',
        query: { 
            categoria: categoriaId.value,
            categoriaNombre: categoriaNombre.value
        }
    });
};

// Función para obtener el color según el stock
const getStockColor = (item) => {
    const percentage = (item.cantidad_disponible / item.cantidad_total_stock) * 100;
    if (percentage === 0) return 'negative';
    if (percentage < 30) return 'warning';
    if (percentage < 70) return 'info';
    return 'positive';
};

// Función para obtener la etiqueta del stock
const getStockLabel = (item) => {
    const percentage = (item.cantidad_disponible / item.cantidad_total_stock) * 100;
    if (percentage === 0) return 'Sin stock';
    if (percentage < 30) return 'Stock bajo';
    if (percentage < 70) return 'Stock medio';
    return 'Stock alto';
};

// Validar que haya aula y categoría seleccionada
const validateParams = () => {
    if (!categoriaId.value || !aulaId.value) {
        $q.notify({
            type: 'warning',
            message: 'Faltan parámetros de navegación',
            position: 'top',
            timeout: 2000
        });
        router.push('/user/zones');
    }
};

// Watch para recargar cuando cambien los parámetros
watch([categoriaId, aulaId], () => {
    if (categoriaId.value && aulaId.value) {
        loadItems();
    }
});

// Cargar ítems al montar el componente
onMounted(() => {
    validateParams();
    if (categoriaId.value && aulaId.value) {
        loadItems();
    }
});
</script>

<style scoped>
.item-card {
    transition: all 0.3s ease;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.item-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.ellipsis-2-lines {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.3em;
    max-height: 2.6em;
    min-height: 2.6em;
}
</style>