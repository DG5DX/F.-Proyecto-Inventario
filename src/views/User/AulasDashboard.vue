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
                :label="categoriaNombre || 'Categoría Actual'" 
                icon="map"
            />
        </q-breadcrumbs>

        <!-- Header -->
        <div class="row items-center justify-between q-mb-lg">
            <div class="text-h5 text-weight-bold text-secondary">
                Aulas en: {{ categoriaNombre || 'Categoría' }}
            </div>
            <q-btn 
                flat 
                round 
                icon="refresh" 
                color="primary"
                @click="loadClassrooms"
                :loading="loading"
            >
                <q-tooltip>Recargar aulas</q-tooltip>
            </q-btn>
        </div>

        <!-- Barra de búsqueda -->
        <div class="q-mb-lg">
            <q-input
                v-model="searchQuery"
                filled
                placeholder="Buscar aula por nombre..."
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
            <div class="text-h6 text-grey-6 q-mt-md">Cargando aulas...</div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="64px" color="negative" class="q-mb-md"/>
            <div class="text-h6 text-negative">{{ error }}</div>
            <q-btn 
                color="primary" 
                label="Reintentar" 
                @click="loadClassrooms" 
                class="q-mt-md"
            />
        </div>

        <!-- Empty State -->
        <q-card v-else-if="filteredClassrooms.length === 0" class="bg-white shadow-1">
            <q-card-section class="text-center q-pa-xl">
                <q-icon name="info" size="64px" color="accent" class="q-mb-md"/>
                <div class="text-h6 text-accent q-mb-sm">
                    {{ searchQuery 
                        ? `No se encontraron aulas que coincidan con "${searchQuery}".` 
                        : 'No hay aulas con ítems en esta categoría actualmente.' 
                    }}
                </div>
                <div class="text-subtitle1 text-grey-6 q-mb-lg">
                    {{ searchQuery 
                        ? 'Intenta una búsqueda más general o limpia el campo de búsqueda.' 
                        : 'Contacta al administrador para agregar ítems.' 
                    }}
                </div>
                <q-btn 
                    color="primary" 
                    label="Volver a Zonas" 
                    icon="arrow_back"
                    @click="router.push('/user/zones')"
                />
            </q-card-section>
        </q-card>

        <!-- Classrooms List -->
        <q-list v-else bordered class="rounded-borders bg-white shadow-1">
            <q-item 
                v-for="(aula, index) in filteredClassrooms" 
                :key="aula._id"
                class="q-py-md aula-item" 
                clickable 
                v-ripple 
                @click="goToItems(aula)"
            >
                <q-item-section avatar>
                    <q-avatar 
                        :color="getAulaColor(index)" 
                        text-color="white" 
                        icon="meeting_room" 
                        size="56px"
                    />
                </q-item-section>

                <q-item-section>
                    <q-item-label class="text-body1 text-weight-bold text-dark">
                        {{ aula.nombre }}
                    </q-item-label>
                    <q-item-label caption class="text-grey-7">
                        {{ aula.descripcion || 'Sin descripción' }}
                    </q-item-label>
                    <q-item-label caption class="text-grey-6 q-mt-xs">
                        <q-icon name="inventory_2" size="xs" class="q-mr-xs"/>
                        {{ aula.itemsCount || 0 }} ítem(s) disponible(s)
                    </q-item-label>
                </q-item-section>

                <q-item-section side>
                    <div class="column items-end q-gutter-xs">
                        <q-badge 
                            :color="aula.itemsCount > 0 ? 'positive' : 'grey'" 
                            :label="aula.itemsCount > 0 ? 'Con Items' : 'Vacía'"
                        />
                        <q-btn 
                            flat 
                            round 
                            icon="chevron_right" 
                            color="primary"
                            size="md"
                        >
                            <q-tooltip>Ver ítems del aula</q-tooltip>
                        </q-btn>
                    </div>
                </q-item-section>
            </q-item>
        </q-list>

        <!-- Footer con estadísticas -->
        <div v-if="filteredClassrooms.length > 0" class="q-mt-md text-center text-grey-6">
            <q-chip icon="meeting_room" color="primary" text-color="white">
                {{ filteredClassrooms.length }} aula(s) encontrada(s)
            </q-chip>
            <q-chip icon="inventory" color="secondary" text-color="white">
                {{ totalItems }} ítem(s) en total
            </q-chip>
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
const classrooms = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');

// Obtener parámetros de la ruta
const categoriaId = computed(() => route.query.categoria);
const categoriaNombre = computed(() => route.query.categoriaNombre);

// Computed para filtrar aulas por búsqueda
const filteredClassrooms = computed(() => {
    if (!searchQuery.value) return classrooms.value;
    
    const query = searchQuery.value.toLowerCase();
    return classrooms.value.filter(aula => 
        aula.nombre.toLowerCase().includes(query) ||
        (aula.descripcion && aula.descripcion.toLowerCase().includes(query))
    );
});

// Computed para total de ítems
const totalItems = computed(() => {
    return filteredClassrooms.value.reduce((sum, aula) => sum + (aula.itemsCount || 0), 0);
});

// Función para cargar aulas con ítems de esta categoría
const loadClassrooms = async () => {
    loading.value = true;
    error.value = null;
    
    try {
        // Cargar ítems filtrados por categoría
        const itemsData = await itemsService.getAll({ 
            categoria: categoriaId.value 
        });
        
        // Extraer aulas únicas y contar ítems por aula
        const aulasMap = new Map();
        
        itemsData.forEach(item => {
            if (item.aula && item.aula._id) {
                const aulaId = item.aula._id;
                
                if (!aulasMap.has(aulaId)) {
                    aulasMap.set(aulaId, {
                        ...item.aula,
                        itemsCount: 0
                    });
                }
                
                const aula = aulasMap.get(aulaId);
                aula.itemsCount += 1;
            }
        });
        
        // Convertir a array y ordenar por cantidad de ítems
        classrooms.value = Array.from(aulasMap.values())
            .sort((a, b) => b.itemsCount - a.itemsCount);
        
        if (classrooms.value.length === 0) {
            $q.notify({
                type: 'info',
                message: 'No hay aulas con ítems en esta categoría',
                position: 'top',
                timeout: 2000
            });
        }
    } catch (err) {
        console.error('Error cargando aulas:', err);
        error.value = 'Error al cargar las aulas. Por favor, intenta nuevamente.';
        
        $q.notify({
            type: 'negative',
            message: 'No se pudieron cargar las aulas',
            position: 'top',
            icon: 'error',
            timeout: 3000
        });
    } finally {
        loading.value = false;
    }
};

// Función para navegar a los ítems de un aula
const goToItems = (aula) => {
    router.push({
        name: 'user.items',
        query: { 
            categoria: categoriaId.value,
            categoriaNombre: categoriaNombre.value,
            aula: aula._id,
            aulaNombre: aula.nombre
        }
    });
};

// Función para obtener color del avatar
const getAulaColor = (index) => {
    const colors = ['primary', 'secondary', 'accent', 'positive', 'info', 'warning'];
    return colors[index % colors.length];
};

// Validar que haya categoría seleccionada
const validateCategory = () => {
    if (!categoriaId.value) {
        $q.notify({
            type: 'warning',
            message: 'No se ha seleccionado una categoría',
            position: 'top',
            timeout: 2000
        });
        router.push('/user/zones');
    }
};

// Watch para recargar cuando cambie la categoría
watch(() => categoriaId.value, (newVal) => {
    if (newVal) {
        loadClassrooms();
    }
});

// Cargar aulas al montar el componente
onMounted(() => {
    validateCategory();
    if (categoriaId.value) {
        loadClassrooms();
    }
});
</script>

<style scoped>
.aula-item {
    border-bottom: 1px solid #eee;
    transition: all 0.3s ease;
}

.aula-item:last-child {
    border-bottom: none;
}

.aula-item:hover {
    background-color: #f5f5f5;
    transform: translateX(4px);
}

.rounded-borders {
    border-radius: 12px;
}
</style>