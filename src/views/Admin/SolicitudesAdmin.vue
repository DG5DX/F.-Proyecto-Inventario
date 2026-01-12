<template>
    <q-page class="q-pa-md bg-grey-2">
        <!-- Header -->
        <div class="row items-center q-mb-md">
            <q-icon name="notifications" size="md" color="orange-8" class="q-mr-sm"/>
            <div class="text-h5 text-weight-bold">Solicitudes de Préstamo Pendientes</div>
            <q-space />
            <q-btn 
                color="orange-8" 
                icon="refresh" 
                label="Actualizar" 
                flat 
                dense 
                @click="loadRequests"
                :loading="loading"
            />
        </div>

        <!-- Loading State -->
        <div v-if="loading && !pendingRequests.length" class="text-center q-py-xl">
            <q-spinner-dots size="64px" color="primary" />
            <div class="text-h6 text-grey-6 q-mt-md">Cargando solicitudes...</div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="64px" color="negative" class="q-mb-md"/>
            <div class="text-h6 text-negative">{{ error }}</div>
            <q-btn 
                color="primary" 
                label="Reintentar" 
                @click="loadRequests" 
                class="q-mt-md"
            />
        </div>

        <!-- Tabla de solicitudes -->
        <q-card v-else flat bordered class="q-mt-sm">
            <q-card-section>
                <q-table 
                    title="Prestamos por Aprobar" 
                    :rows="pendingRequests" 
                    :columns="columns" 
                    row-key="_id"
                    :filter="filter" 
                    :loading="loading" 
                    :rows-per-page-options="[10, 25, 50]"
                    no-data-label="¡Felicidades! No hay solicitudes pendientes."
                >
                    <template v-slot:top-right>
                        <q-input 
                            borderless 
                            dense 
                            debounce="300" 
                            v-model="filter" 
                            placeholder="Buscar por solicitante o Ítem"
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

                    <template v-slot:body-cell-solicitante="props">
                        <q-td :props="props">
                            <div class="text-weight-medium">{{ props.row.usuario?.nombre || 'N/A' }}</div>
                            <div class="text-caption text-grey-6">
                                {{ props.row.usuario?.email || 'N/A' }}
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

                    <template v-slot:body-cell-actions="props">
                        <q-td :props="props">
                            <q-btn 
                                icon="thumb_up" 
                                label="Aprobar" 
                                color="positive" 
                                size="sm" 
                                flat 
                                dense
                                @click="openApproveDialog(props.row)"
                            />
                            <q-btn 
                                icon="thumb_down" 
                                label="Rechazar" 
                                color="negative" 
                                size="sm" 
                                flat 
                                dense 
                                class="q-ml-sm"
                                @click="confirmReject(props.row)"
                            />
                        </q-td>
                    </template>
                </q-table>
            </q-card-section>
        </q-card>

        <!-- Dialog para aprobar con fecha estimada -->
        <q-dialog v-model="approveDialog" persistent>
            <q-card style="width: 450px; max-width: 95%;">
                <q-toolbar class="bg-positive text-white">
                    <q-icon name="thumb_up" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">
                        Aprobar Solicitud
                    </q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>

                <q-card-section>
                    <div class="text-subtitle1 q-mb-md">
                        <strong>Solicitante:</strong> {{ selectedRequest?.usuario?.nombre }}<br>
                        <strong>Ítem:</strong> {{ selectedRequest?.item?.nombre }}<br>
                        <strong>Cantidad:</strong> {{ selectedRequest?.cantidad_prestamo }}<br>
                        <strong>Aula:</strong> {{ selectedRequest?.aula?.nombre }}
                    </div>

                    <q-banner class="bg-blue-1 text-primary q-mb-md" rounded>
                        <template v-slot:avatar>
                            <q-icon name="info" color="primary" />
                        </template>
                        Stock disponible: <strong>{{ selectedRequest?.item?.cantidad_disponible }}</strong>
                    </q-banner>

                    <q-form @submit.prevent="submitApproval" class="q-gutter-md">
                        <q-input
                            v-model="approvalForm.fecha_estimada"
                            filled
                            label="Fecha y Hora de Devolución Estimada"
                            type="datetime-local"
                            color="positive"
                            :min="minReturnDate"
                            :rules="[
                                val => !!val || 'Fecha requerida',
                                val => new Date(val) > new Date() || 'La fecha debe ser futura'
                            ]"
                        >
                            <template v-slot:prepend>
                                <q-icon name="event" color="positive" />
                            </template>
                        </q-input>

                        <q-input 
                            v-model="approvalForm.notas"
                            label="Notas adicionales (opcional)" 
                            type="textarea" 
                            rows="2" 
                            filled
                            color="positive"
                            counter
                            maxlength="300"
                        />

                        <q-card-actions align="right" class="q-mt-lg q-pb-none">
                            <q-btn flat label="Cancelar" color="grey" v-close-popup />
                            <q-btn 
                                label="Aprobar Préstamo" 
                                type="submit" 
                                color="positive" 
                                icon="check_circle"
                                :loading="submitting"
                            />
                        </q-card-actions>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>

        <!-- Dialog de confirmación de rechazo -->
        <q-dialog v-model="rejectDialog" persistent>
            <q-card style="width: 90vw; max-width: 400px;">
                <q-card-section class="row items-center">
                    <q-avatar icon="thumb_down" color="negative" text-color="white" />
                    <span class="q-ml-sm text-h6">Rechazar Solicitud</span>
                </q-card-section>

                <q-card-section>
                    ¿Estás seguro que deseas rechazar la solicitud de 
                    <strong>{{ requestToReject?.usuario?.nombre }}</strong> 
                    para el ítem 
                    <strong>"{{ requestToReject?.item?.nombre }}"</strong>?
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="grey" v-close-popup />
                    <q-btn 
                        flat 
                        label="Rechazar" 
                        color="negative" 
                        icon="thumb_down"
                        @click="rejectRequest(requestToReject)" 
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>


        <!-- Estadí­sticas -->
        <div v-if="pendingRequests.length > 0" class="q-mt-lg text-center">
            <q-chip icon="pending" color="orange" text-color="white">
                {{ pendingRequests.length }} solicitud(es) pendiente(s)
            </q-chip>
        </div>
    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { loansService } from '../../services/items.js';

const $q = useQuasar();

// Estados reactivos
const pendingRequests = ref([]);
const loading = ref(false);
const error = ref(null);
const filter = ref('');

// Dialog de aprobación
const approveDialog = ref(false);
const selectedRequest = ref(null);
const submitting = ref(false);
const approvalForm = ref({
    fecha_estimada: '',
    notas: ''
});

// Dialog de confirmación de rechazo
const rejectDialog = ref(false);
const requestToReject = ref(null);


// Columnas de la tabla
const columns = [
    { 
        name: 'id', 
        required: true, 
        label: 'ID', 
        align: 'left', 
        field: '_id',
        sortable: true,
        format: val => val.slice(-6).toUpperCase()
    },
    { 
        name: 'item', 
        align: 'left', 
        label: 'Ítem Solicitado', 
        field: row => row.item?.nombre,
        sortable: true 
    },
    { 
        name: 'solicitante', 
        align: 'left', 
        label: 'Solicitante', 
        field: row => row.usuario?.nombre,
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
        name: 'actions', 
        label: 'Acciones', 
        field: 'actions', 
        align: 'center' 
    }
];

// Computed para fecha máxima de retorno (hoy)
const minReturnDate = computed(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
});

// Función para cargar solicitudes pendientes
const loadRequests = async () => {
    loading.value = true;
    error.value = null;
    
    try {
        const data = await loansService.getAll({ estado: 'Pendiente' });
        pendingRequests.value = data;
        
        if (data.length === 0) {
            $q.notify({
                type: 'positive',
                message: 'No hay solicitudes pendientes',
                position: 'top',
                timeout: 2000
            });
        }
    } catch (err) {
        console.error('Error cargando solicitudes:', err);
        error.value = 'Error al cargar las solicitudes. Por favor, intenta nuevamente.';
        
        $q.notify({
            type: 'negative',
            message: 'No se pudieron cargar las solicitudes',
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

// Función para abrir dialog de aprobación
const openApproveDialog = (request) => {
    selectedRequest.value = request;
    
    // Establecer fecha estimada por defecto (7 dí­as desde ahora)
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    defaultDate.setMinutes(defaultDate.getMinutes() - defaultDate.getTimezoneOffset());
    approvalForm.value.fecha_estimada = defaultDate.toISOString().slice(0, 16);
    approvalForm.value.notas = '';
    
    approveDialog.value = true;
};

// Función para enviar aprobación
const submitApproval = async () => {
    if (!selectedRequest.value) return;

    // Validar stock disponible
    if (selectedRequest.value.cantidad_prestamo > selectedRequest.value.item?.cantidad_disponible) {
        $q.notify({
            type: 'warning',
            message: 'No hay suficiente stock disponible',
            position: 'top',
            timeout: 3000
        });
        return;
    }

    submitting.value = true;

    try {
        const fechaEstimadaISO = new Date(approvalForm.value.fecha_estimada).toISOString();

        await loansService.approve(selectedRequest.value._id, fechaEstimadaISO);

        $q.notify({
            type: 'positive',
            message: 'Préstamo aprobado exitosamente',
            position: 'top',
            icon: 'check_circle',
            timeout: 3000
        });

        approveDialog.value = false;
        await loadRequests();

    } catch (err) {
        console.error('Error al aprobar préstamo:', err);
        
        const errorMessage = err.response?.data?.message || 'No se pudo aprobar el préstamo';
        
        $q.notify({
            type: 'negative',
            message: errorMessage,
            position: 'top',
            icon: 'error',
            timeout: 4000
        });
    } finally {
        submitting.value = false;
    }
};

// Función para confirmar rechazo
const confirmReject = (request) => {
    requestToReject.value = request;
    rejectDialog.value = true;
};

// Función para rechazar solicitud
const rejectRequest = async (request) => {
    if (!request) return;
    
    try {
        await loansService.reject(request._id);

        $q.notify({
            type: 'info',
            message: 'Solicitud rechazada',
            position: 'top',
            icon: 'info',
            timeout: 2500
        });

        rejectDialog.value = false;
        requestToReject.value = null;
        await loadRequests();

    } catch (err) {
        console.error('Error al rechazar préstamo:', err);
        
        const errorMessage = err.response?.data?.message || 'No se pudo rechazar el préstamo';
        
        $q.notify({
            type: 'negative',
            message: errorMessage,
            position: 'top',
            icon: 'error',
            timeout: 3000
        });
    }
};

// Cargar solicitudes al montar
onMounted(() => {
    loadRequests();
    
    // Actualizar cada 30 segundos
    setInterval(loadRequests, 30000);
});
</script>

<style scoped>
.bg-grey-2 {
    background-color: #f0f4f8;
}
</style>