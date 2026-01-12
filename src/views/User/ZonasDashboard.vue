<template>
    <q-page class="q-pa-lg bg-grey-2">
        <div class="text-h4 text-weight-bold q-mb-md text-dark">
            Explorar Inventario por Zona
        </div>
        <q-separator class="q-mb-lg"/>

        <!-- Barra de búsqueda -->
        <div class="q-mb-lg">
            <q-input
                v-model="searchQuery"
                filled
                placeholder="Buscar Zona por nombre..."
                clearable
                @clear="searchQuery = ''"
            >
                <template v-slot:prepend>
                    <q-icon name="search" />
                </template>
            </q-input>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center q-py-xl">
            <q-spinner-dots size="64px" color="primary" />
            <div class="text-h6 text-grey-6 q-mt-md">Cargando zonas...</div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="64px" color="negative" class="q-mb-md"/>
            <div class="text-h6 text-negative">{{ error }}</div>
            <q-btn 
                color="primary" 
                label="Reintentar" 
                @click="loadZones" 
                class="q-mt-md"
            />
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredZones.length === 0" class="text-center q-py-xl">
            <q-icon name="search_off" size="64px" color="accent" class="q-mb-md"/>
            <div class="text-h6 text-accent">
                {{ searchQuery 
                    ? `No se encontraron zonas que coincidan con "${searchQuery}".` 
                    : 'No hay zonas disponibles.' 
                }}
            </div>
            <div class="text-subtitle1 text-grey-6">
                {{ searchQuery 
                    ? 'Intenta una búsqueda más general o limpia el campo de búsqueda.' 
                    : 'Contacta al administrador para agregar zonas al sistema.' 
                }}
            </div>
        </div>

        <!-- Zones Grid -->
        <div v-else class="row q-col-gutter-lg">
            <div 
                v-for="zone in filteredZones" 
                :key="zone._id"
                class="col-12 col-sm-6 col-md-4 col-lg-3"
            >
                <q-card 
                    class="zone-card cursor-pointer" 
                    @click="goToClassrooms(zone)"
                    :style="{ background: getZoneColor(zone) }"
                >
                    <q-card-section class="text-white q-pa-lg">
                        <div class="row items-center">
                            <div class="col-8">
                                <div class="text-h5 text-weight-bold ellipsis-2-lines">
                                    {{ zone.nombre }}
                                </div>
                                <div class="text-subtitle2 text-weight-medium q-mt-sm opacity-80">
                                    {{ zone.descripcion || 'Sin descripción' }}
                                </div>
                            </div>
                            <div class="col-4 text-right">
                                <q-icon :name="getZoneIcon(zone)" size="48px"/>
                            </div>
                        </div>
                    </q-card-section>

                    <q-card-actions class="bg-white q-pa-md" align="right">
                        <q-btn 
                            flat 
                            color="primary"
                            icon-right="chevron_right" 
                            label="Ver Aulas"
                        />
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
import { itemsService } from '../../services/items.js';

const router = useRouter();
const $q = useQuasar();

// Estados reactivos
const zones = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');

// Computed para filtrar zonas por búsqueda
const filteredZones = computed(() => {
    if (!searchQuery.value) return zones.value;
    
    const query = searchQuery.value.toLowerCase();
    return zones.value.filter(zone => 
        zone.nombre.toLowerCase().includes(query) ||
        (zone.descripcion && zone.descripcion.toLowerCase().includes(query))
    );
});

// Función para cargar zonas desde los ítems
const loadZones = async () => {
    loading.value = true;
    error.value = null;
    
    try {
        // Cargar todos los ítems (esto no requiere permisos de admin)
        const items = await itemsService.getAll();
        
        // Extraer zonas únicas de los ítems
        const categoriesMap = new Map();
        items.forEach(item => {
            if (item.categoria && item.categoria._id) {
                categoriesMap.set(item.categoria._id, item.categoria);
            }
        });
        
        zones.value = Array.from(categoriesMap.values());
        
        if (zones.value.length === 0) {
            $q.notify({
                type: 'info',
                message: 'No hay zonas disponibles en el sistema',
                position: 'top',
                timeout: 2000
            });
        }
    } catch (err) {
        console.error('Error cargando zonas:', err);
        error.value = 'Error al cargar las zonas. Por favor, intenta nuevamente.';
        
        $q.notify({
            type: 'negative',
            message: 'No se pudieron cargar las zonas',
            position: 'top',
            icon: 'error',
            timeout: 3000
        });
    } finally {
        loading.value = false;
    }
};

// Función para navegar a las aulas de una zona
const goToClassrooms = (zone) => {
    router.push({
        name: 'user.classrooms',
        query: { 
            categoria: zone._id, 
            categoriaNombre: zone.nombre 
        }
    });
};

// Función para obtener el color de la zona (aleatorio pero consistente)
const getZoneColor = (zone) => {
    const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
    ];
    
    const index = zone._id.charCodeAt(zone._id.length - 1) % colors.length;
    return colors[index];
};

// Función para obtener el icono de la zona
const getZoneIcon = (zone) => {
    const iconMap = {
        'laboratorio': 'science',
        'aula': 'school',
        'taller': 'construction',
        'oficina': 'business',
        'bodega': 'inventory_2',
        'biblioteca': 'local_library',
        'audiovisual': 'tv',
        'deportes': 'sports_soccer',
        'música': 'music_note',
        'arte': 'palette',
        'default': 'category'
    };
    
    const nombre = zone.nombre.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
        if (nombre.includes(key)) {
            return icon;
        }
    }
    
    return iconMap.default;
};

// Cargar zonas al montar el componente
onMounted(() => {
    loadZones();
});
</script>

<style scoped>
.zone-card {
    transition: all 0.3s ease;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.zone-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

.ellipsis-2-lines {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.4em;
    max-height: 2.8em;
}

.opacity-80 {
    opacity: 0.8;
}
</style>