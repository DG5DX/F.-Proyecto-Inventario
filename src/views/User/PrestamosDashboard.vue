<template>
    <q-page class="q-pa-lg bg-grey-2">
        <!-- Header -->
        <div class="row items-center q-mb-md">
            <q-icon name="view_list" size="md" color="primary" class="q-mr-sm" />
            <div class="text-h5 text-weight-bold text-dark">Mis Préstamos</div>
            <q-space />
            <q-btn 
                color="secondary" 
                icon="refresh" 
                label="Actualizar" 
                flat 
                dense 
                @click="loadLoans"
                :loading="loading"
            />
        </div>

        <!-- Filtros de estado -->
        <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-12">
                <q-btn-toggle
                    v-model="estadoFiltro"
                    spread
                    no-caps
                    toggle-color="primary"
                    color="white"
                    text-color="grey-8"
                    :options="[
                        {label: 'Todos', value: null},
                        {label: 'Pendientes', value: 'Pendiente', icon: 'pending'},
                        {label: 'Aprobados', value: 'Aprobado', icon: 'check_circle'},
                        {label: 'Rechazados', value: 'Rechazado', icon: 'cancel'},
                        {label: 'Aplazados', value: 'Aplazado', icon: 'event_repeat'},
                        {label: 'Devueltos', value: 'Devuelto', icon: 'check'}
                    ]"
                />
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading && !loans.length" class="text-center q-py-xl">
            <q-spinner-dots size="64px" color="primary" />
            <div class="text-h6 text-grey-6 q-mt-md">Cargando préstamos...</div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="64px" color="negative" class="q-mb-md"/>
            <div class="text-h6 text-negative">{{ error }}</div>
            <q-btn 
                color="primary" 
                label="Reintentar" 
                @click="loadLoans" 
                class="q-mt-md"
            />
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredLoans.length === 0" class="text-center q-py-xl">
            <q-icon name="inventory_2" size="64px" color="grey-5" class="q-mb-md"/>
            <div class="text-h6 text-grey-7">
                {{ estadoFiltro 
                    ? `No tienes préstamos ${estadoFiltro.toLowerCase()}s` 
                    : 'No tienes préstamos registrados' 
                }}
            </div>
            <div class="text-subtitle1 text-grey-6 q-mb-lg">
                {{ estadoFiltro 
                    ? 'Intenta cambiar el filtro para ver otros préstamos' 
                    : 'Explora el catálogo y solicita tu primer préstamo' 
                }}
            </div>
            <q-btn 
                color="primary" 
                label="Explorar Catálogo" 
                icon="view_module"
                @click="router.push('/user/zones')"
            />
        </div>

        <!-- Tabla de préstamos -->
        <q-card v-else flat bordered class="q-mt-sm">
            <q-card-section>
                <q-table 
                    :title="`Préstamos ${estadoFiltro ? `(${estadoFiltro}s)` : ''}`"
                    :rows="filteredLoans"
                    :columns="columns"
                    row-key="_id"
                    :filter="searchFilter"
                    :loading="loading"
                    :rows-per-page-options="[10, 25, 50]"
                    no-data-label="No tienes préstamos."
                    :row-class="getRowClass"
                    class="loans-table"
                > 
                    <template v-slot:top-right>
                        <q-input 
                            borderless 
                            dense 
                            debounce="300" 
                            v-model="searchFilter" 
                            placeholder="Buscar por ítem"
                        >
                            <template v-slot:append>
                                <q-icon name="search" />
                            </template>
                        </q-input>
                    </template>

                    <template v-slot:body-cell-item="props">
                        <q-td :props="props">
                            <div class="text-weight-medium">{{ props.row.item?.nombre || 'N/A' }}</div>
                            <div class="text-caption text-grey-6">
                                {{ props.row.aula?.nombre || 'N/A' }}
                            </div>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-cantidad="props">
                        <q-td :props="props">
                            <q-chip dense color="blue-grey-2" text-color="dark">
                                {{ props.row.cantidad_prestamo }}
                            </q-chip>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-fecha_solicitud="props">
                        <q-td :props="props">
                            <div class="text-caption">
                                {{ formatDate(props.row.fecha_solicitud) }}
                            </div>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-fecha_estimada="props">
                        <q-td :props="props">
                            <div v-if="props.row.fecha_estimada" class="text-caption">
                                {{ formatDate(props.row.fecha_estimada) }}
                            </div>
                            <div v-else class="text-caption text-grey-5">
                                Pendiente de aprobación
                            </div>
                            <div v-if="isOverdue(props.row)" class="text-negative text-weight-bold text-caption">
                                ¡VENCIDO!
                            </div>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-status="props">
                        <q-td :props="props">
                            <q-badge 
                                :color="getStatusColor(props.row.estado)" 
                                class="q-px-sm q-py-xs text-weight-bold"
                            >
                                {{ props.row.estado }}
                            </q-badge>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-actions="props">
                        <q-td :props="props">
                            <!-- Info para pendientes -->
                            <q-btn
                                v-if="props.row.estado === 'Pendiente'"
                                icon="schedule"
                                label="Esperando"
                                color="grey"
                                size="sm"
                                flat
                                dense
                                disable
                            >
                                <q-tooltip>Esperando aprobación del administrador</q-tooltip>
                            </q-btn>
                            
                            <!-- Info para aprobados/aplazados -->
                            <q-btn
                                v-else-if="['Aprobado', 'Aplazado'].includes(props.row.estado)"
                                icon="info"
                                label="Activo"
                                color="positive"
                                size="sm"
                                flat
                                dense
                                disable
                            >
                                <q-tooltip>Préstamo activo - Devolver antes de {{ formatDate(props.row.fecha_estimada) }}</q-tooltip>
                            </q-btn>

                            <!-- Info para devueltos -->
                            <q-icon 
                                v-else-if="props.row.estado === 'Devuelto'"
                                name="check_circle" 
                                color="positive" 
                                size="sm"
                            >
                                <q-tooltip>Préstamo completado el {{ formatDate(props.row.fecha_retorno) }}</q-tooltip>
                            </q-icon>

                            <!-- Info para rechazados -->
                            <q-icon 
                                v-else-if="props.row.estado === 'Rechazado'"
                                name="cancel" 
                                color="negative" 
                                size="sm"
                            >
                                <q-tooltip>Solicitud rechazada</q-tooltip>
                            </q-icon>
                        </q-td>
                    </template>
                </q-table>
            </q-card-section>
        </q-card>

        <!-- Estadísticas -->
        <div v-if="loans.length > 0" class="q-mt-lg text-center">
            <q-chip icon="pending" color="grey" text-color="white">
                {{ countByStatus('Pendiente') }} pendiente(s)
            </q-chip>
            <q-chip icon="check_circle" color="positive" text-color="white">
                {{ countByStatus('Aprobado') }} aprobado(s)
            </q-chip>
            <q-chip icon="cancel" color="negative" text-color="white">
                {{ countByStatus('Rechazado') }} rechazado(s)
            </q-chip>
            <q-chip icon="check" color="blue" text-color="white">
                {{ countByStatus('Devuelto') }} devuelto(s)
            </q-chip>
        </div>
    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { loansService } from '../../services/items.js';

const $q = useQuasar();
const router = useRouter();

// Estados reactivos
const loans = ref([]);
const loading = ref(false);
const error = ref(null);
const searchFilter = ref('');
const estadoFiltro = ref(null);

// Columnas de la tabla
const columns = [
    { 
        name: 'item', 
        required: true, 
        label: 'Ítem', 
        align: 'left', 
        field: row => row.item?.nombre,
        sortable: true 
    },
    { 
        name: 'cantidad', 
        align: 'center', 
        label: 'Cantidad', 
        field: 'cantidad_prestamo', 
        sortable: true 
    },
    { 
        name: 'fecha_solicitud', 
        align: 'center', 
        label: 'F. Solicitud', 
        field: 'fecha_solicitud', 
        sortable: true 
    },
    { 
        name: 'fecha_estimada', 
        align: 'center', 
        label: 'F. Devolución', 
        field: 'fecha_estimada', 
        sortable: true 
    },
    { 
        name: 'status', 
        label: 'Estado', 
        field: 'estado', 
        align: 'center',
        sortable: true
    },
    { 
        name: 'actions', 
        label: 'Info', 
        field: 'actions', 
        align: 'center' 
    }
];

// Computed para préstamos filtrados
const filteredLoans = computed(() => {
    if (!estadoFiltro.value) return loans.value;
    return loans.value.filter(loan => loan.estado === estadoFiltro.value);
});

// Función para cargar préstamos
const loadLoans = async () => {
    loading.value = true;
    error.value = null;
    
    try {
        const data = await loansService.getAll();
        loans.value = data;
    } catch (err) {
        console.error('Error cargando préstamos:', err);
        error.value = 'Error al cargar los préstamos. Por favor, intenta nuevamente.';
        
        $q.notify({
            type: 'negative',
            message: 'No se pudieron cargar los préstamos',
            position: 'top',
            icon: 'error',
            timeout: 3000
        });
    } finally {
        loading.value = false;
    }
};

// Función para formatear fechas
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Función para obtener color según estado
const getStatusColor = (estado) => {
    const colors = {
        'Pendiente': 'grey',
        'Aprobado': 'positive',
        'Rechazado': 'negative',
        'Devuelto': 'blue',
        'Aplazado': 'orange'
    };
    return colors[estado] || 'grey';
};

// Función para verificar si está vencido
const isOverdue = (loan) => {
    if (!loan.fecha_estimada || loan.estado === 'Devuelto' || loan.estado === 'Rechazado') {
        return false;
    }
    return new Date(loan.fecha_estimada) < new Date();
};

// Función para obtener clase de fila
const getRowClass = (row) => {
    if (isOverdue(row)) {
        return 'loan-expired';
    }
    return '';
};

// Función para contar por estado
const countByStatus = (status) => {
    return loans.value.filter(loan => loan.estado === status).length;
};

// Cargar préstamos al montar
onMounted(() => {
    loadLoans();
    
    // Actualizar cada 30 segundos
    setInterval(loadLoans, 30000);
});
</script>

<style scoped>
.bg-grey-2 {
    background-color: #f0f4f8;
}

.loans-table {
    border-radius: 8px;
}

.loan-expired {
    background-color: #ffebee !important;
    color: #b71c1c !important;
}

.loan-expired td {
    color: #b71c1c !important;
    font-weight: 500;
}

.loan-expired .q-badge {
    color: white !important;
}
</style>