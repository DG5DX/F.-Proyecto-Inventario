<template>
    <q-page class="q-pa-md bg-grey-2">
        <!-- Header -->
        <div class="row items-center q-mb-md">
            <q-icon name="swap_horiz" size="md" color="primary" class="q-mr-sm"/>
            <div class="text-h5 text-weight-bold">Préstamos Activos y Movimientos</div>
            <q-space/>
            <q-btn 
                color="green-7" 
                icon="download" 
                label="Exportar Excel" 
                flat 
                dense 
                @click="exportToExcel"
                :disable="filteredLoans.length === 0"
                class="q-mr-sm"
            >
                <q-tooltip>Descargar préstamos en Excel</q-tooltip>
            </q-btn>
            <q-btn 
                color="primary" 
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
                        {label: 'Aprobados', value: 'Aprobado', icon: 'check_circle'},
                        {label: 'Aplazados', value: 'Aplazado', icon: 'event_repeat'},
                        {label: 'Devueltos', value: 'Devuelto', icon: 'assignment_turned_in'},
                        {label: 'Rechazados', value: 'Rechazado', icon: 'cancel'}
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

        <!-- Tabla de préstamos -->
        <q-card v-else flat bordered class="q-mt-sm prestamos-card">
            <q-card-section class="q-pa-none">
                <q-table 
                    title="Listado de Préstamos" 
                    :rows="filteredLoans" 
                    :columns="columns" 
                    row-key="_id" 
                    :filter="searchFilter" 
                    :loading="loading" 
                    :rows-per-page-options="[10, 25, 50, 0]"
                    no-data-label="No hay préstamos para mostrar"
                    :row-class="getRowClass"
                    class="prestamos-table"
                    flat
                    bordered
                >
                    <template v-slot:top-right>
                        <q-input 
                            borderless 
                            dense 
                            debounce="300" 
                            v-model="searchFilter" 
                            placeholder="Buscar por ítem o solicitante"
                            class="search-input"
                        >
                            <template v-slot:append>
                                <q-icon name="search"/>
                            </template>
                        </q-input>
                    </template>

                    <template v-slot:body-cell-item="props">
                        <q-td :props="props">
                            <div class="text-weight-medium text-dark">{{ props.row.item?.nombre || 'N/A' }}</div>
                            <div class="text-caption text-grey-6">
                                <q-icon name="meeting_room" size="xs" class="q-mr-xs"/>
                                {{ props.row.aula?.nombre || 'N/A' }}
                            </div>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-solicitante="props">
                        <q-td :props="props">
                            <div class="text-weight-medium text-dark">{{ props.row.usuario?.nombre || 'N/A' }}</div>
                            <div class="text-caption text-grey-6">
                                <q-icon name="email" size="xs" class="q-mr-xs"/>
                                {{ props.row.usuario?.email || 'N/A' }}
                            </div>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-cantidad="props">
                        <q-td :props="props">
                            <q-chip 
                                dense 
                                color="blue-grey-3" 
                                text-color="dark"
                                size="sm"
                            >
                                <q-icon name="inventory" size="xs" class="q-mr-xs"/>
                                {{ props.row.cantidad_prestamo }}
                            </q-chip>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-fecha_prestamo="props">
                        <q-td :props="props">
                            <div class="text-caption text-dark">
                                <q-icon name="event" size="xs" class="q-mr-xs"/>
                                {{ formatDate(props.row.fecha_prestamo) }}
                            </div>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-fecha_estimada="props">
                        <q-td :props="props">
                            <div v-if="props.row.fecha_estimada" class="text-caption text-dark">
                                <q-icon name="schedule" size="xs" class="q-mr-xs"/>
                                {{ formatDate(props.row.fecha_estimada) }}
                            </div>
                            <div v-else class="text-caption text-grey-5">
                                N/A
                            </div>
                            <div v-if="isOverdue(props.row)" class="text-negative text-weight-bold text-caption q-mt-xs">
                                <q-icon name="warning" size="xs" class="q-mr-xs"/>
                                ¡VENCIDO!
                            </div>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-status="props">
                        <q-td :props="props">
                            <q-badge 
                                :color="getStatusColor(props.row.estado)" 
                                text-color="white" 
                                class="q-px-md q-py-xs"
                            >
                                {{ props.row.estado }}
                            </q-badge>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-actions="props">
                        <q-td :props="props">
                            <div class="row no-wrap items-center justify-center q-gutter-xs">
                                <!-- Botón Devolver -->
                                <q-btn 
                                    v-if="canReturn(props.row)"
                                    icon="assignment_turned_in" 
                                    color="positive"
                                    size="sm" 
                                    round
                                    flat 
                                    dense
                                    @click="confirmReturn(props.row)"
                                >
                                    <q-tooltip>Marcar como devuelto</q-tooltip>
                                </q-btn>

                                <!-- Botón Aplazar -->
                                <q-btn 
                                    v-if="canDelay(props.row)"
                                    icon="event_repeat" 
                                    color="orange-8"
                                    size="sm" 
                                    round
                                    flat 
                                    dense
                                    @click="openDelayDialog(props.row)"
                                >
                                    <q-tooltip>Extender fecha de devolución</q-tooltip>
                                </q-btn>

                                <!-- Botón Ver Detalle -->
                                <q-btn 
                                    icon="remove_red_eye" 
                                    color="blue-8" 
                                    size="sm" 
                                    round
                                    flat 
                                    dense 
                                    @click="openDetailDialog(props.row)"
                                >
                                    <q-tooltip>Ver detalles</q-tooltip>
                                </q-btn>

                                <!-- Botón Eliminar (siempre visible para admin) -->
                                <q-btn 
                                    icon="delete" 
                                    color="negative" 
                                    size="sm" 
                                    round
                                    flat 
                                    dense 
                                    @click="confirmDelete(props.row)"
                                >
                                    <q-tooltip>Eliminar préstamo</q-tooltip>
                                </q-btn>

                                <!-- Estado completado -->
                                <q-icon 
                                    v-if="props.row.estado === 'Devuelto'"
                                    name="check_circle" 
                                    color="positive" 
                                    size="sm"
                                >
                                    <q-tooltip>Préstamo completado</q-tooltip>
                                </q-icon>
                            </div>
                        </q-td>
                    </template>
                </q-table>
            </q-card-section>
        </q-card>

        <!-- Dialog para aplazar préstamo -->
        <q-dialog v-model="delayDialog" persistent>
            <q-card style="width: 450px; max-width: 95%;">
                <q-toolbar class="bg-orange-8 text-white">
                    <q-icon name="event_repeat" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">
                        Aplazar Préstamo
                    </q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>

                <q-card-section>
                    <div class="text-subtitle1 q-mb-md">
                        <strong>Solicitante:</strong> {{ selectedLoan?.usuario?.nombre }}<br>
                        <strong>Ítem:</strong> {{ selectedLoan?.item?.nombre }}<br>
                        <strong>Cantidad:</strong> {{ selectedLoan?.cantidad_prestamo }}<br>
                        <strong>Fecha actual de devolución:</strong> 
                        <span class="text-negative text-weight-bold">
                            {{ formatDate(selectedLoan?.fecha_estimada) }}
                        </span>
                    </div>

                    <q-form @submit.prevent="submitDelay" class="q-gutter-md">
                        <q-input
                            v-model="delayForm.nueva_fecha_estimada"
                            filled
                            label="Nueva Fecha de Devolución"
                            type="datetime-local"
                            color="orange-8"
                            :min="minDelayDate"
                            :rules="[
                                val => !!val || 'Fecha requerida',
                                val => new Date(val) > new Date(selectedLoan?.fecha_estimada) || 'La nueva fecha debe ser posterior a la actual',
                                val => new Date(val) > new Date() || 'No puedes aplazar a una fecha pasada'
                            ]"
                        >
                            <template v-slot:prepend>
                                <q-icon name="event" color="orange-8" />
                            </template>
                        </q-input>

                        <q-card-actions align="right" class="q-mt-lg q-pb-none">
                            <q-btn flat label="Cancelar" color="grey" v-close-popup />
                            <q-btn 
                                label="Aplazar Préstamo" 
                                type="submit" 
                                color="orange-8" 
                                icon="check"
                                :loading="submitting"
                            />
                        </q-card-actions>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>

        <!-- Dialog de detalle -->
        <q-dialog v-model="detailDialog">
            <q-card style="width: 500px; max-width: 95%;">
                <q-toolbar class="bg-blue-8 text-white">
                    <q-icon name="info" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">
                        Detalle del Préstamo
                    </q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>

                <q-card-section v-if="selectedLoan">
                    <q-list separator>
                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="tag" color="primary" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label caption>ID Préstamo</q-item-label>
                                <q-item-label class="text-weight-medium">
                                    {{ selectedLoan._id.slice(-8).toUpperCase() }}
                                </q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="inventory" color="primary" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label caption>Ítem</q-item-label>
                                <q-item-label class="text-weight-medium">
                                    {{ selectedLoan.item?.nombre }}
                                </q-item-label>
                                <q-item-label caption>
                                    Cantidad: {{ selectedLoan.cantidad_prestamo }}
                                </q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="person" color="primary" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label caption>Solicitante</q-item-label>
                                <q-item-label class="text-weight-medium">
                                    {{ selectedLoan.usuario?.nombre }}
                                </q-item-label>
                                <q-item-label caption>
                                    {{ selectedLoan.usuario?.email }}
                                </q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="meeting_room" color="primary" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label caption>Ubicación</q-item-label>
                                <q-item-label class="text-weight-medium">
                                    {{ selectedLoan.aula?.nombre }}
                                </q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="event" color="primary" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label caption>Fecha de Solicitud</q-item-label>
                                <q-item-label class="text-weight-medium">
                                    {{ formatDate(selectedLoan.fecha_solicitud) }}
                                </q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item v-if="selectedLoan.fecha_prestamo">
                            <q-item-section avatar>
                                <q-icon name="check_circle" color="positive" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label caption>Fecha de Préstamo</q-item-label>
                                <q-item-label class="text-weight-medium">
                                    {{ formatDate(selectedLoan.fecha_prestamo) }}
                                </q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item v-if="selectedLoan.fecha_estimada">
                            <q-item-section avatar>
                                <q-icon name="schedule" color="orange" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label caption>Fecha Estimada de Devolución</q-item-label>
                                <q-item-label class="text-weight-medium">
                                    {{ formatDate(selectedLoan.fecha_estimada) }}
                                </q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item v-if="selectedLoan.fecha_retorno">
                            <q-item-section avatar>
                                <q-icon name="assignment_turned_in" color="positive" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label caption>Fecha de Devolución Real</q-item-label>
                                <q-item-label class="text-weight-medium">
                                    {{ formatDate(selectedLoan.fecha_retorno) }}
                                </q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="info" color="primary" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label caption>Estado</q-item-label>
                                <q-badge 
                                    :color="getStatusColor(selectedLoan.estado)" 
                                    :label="selectedLoan.estado"
                                />
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Cerrar" color="primary" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- Dialog de confirmación para devolución -->
        <q-dialog v-model="confirmReturnDialog" persistent>
            <q-card style="width: 450px; max-width: 95%;">
                <q-toolbar class="bg-positive text-white">
                    <q-icon name="assignment_turned_in" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">
                        Confirmar Devolución
                    </q-toolbar-title>
                </q-toolbar>

                <q-card-section class="q-pt-md">
                    <div class="text-subtitle1">
                        ¿Confirmas que <strong>{{ loanToReturn?.usuario?.nombre }}</strong> ha devuelto 
                        <strong>"{{ loanToReturn?.item?.nombre }}"</strong> 
                        ({{ loanToReturn?.cantidad_prestamo }} unidad/es)?
                    </div>
                    
                    <div v-if="loanToReturn" class="text-caption text-grey-7 q-mt-md">
                        <strong>Detalles:</strong><br>
                        • Aula: {{ loanToReturn.aula?.nombre || 'N/A' }}<br>
                        • Fecha estimada: {{ formatDate(loanToReturn.fecha_estimada) }}
                    </div>
                </q-card-section>

                <q-card-actions align="right" class="q-pa-md">
                    <q-btn 
                        flat 
                        label="Cancelar" 
                        color="grey" 
                        v-close-popup 
                        @click="loanToReturn = null"
                    />
                    <q-btn 
                        label="Confirmar Devolución" 
                        color="positive" 
                        icon="check"
                        @click="executeReturn"
                        :loading="submitting"
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- Dialog de confirmación para eliminación -->
        <q-dialog v-model="confirmDeleteDialog" persistent>
            <q-card style="width: 500px; max-width: 95%;">
                <q-toolbar class="bg-negative text-white">
                    <q-icon name="warning" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">
                        Eliminar Préstamo
                    </q-toolbar-title>
                </q-toolbar>

                <q-card-section class="q-pt-md">
                    <div class="text-subtitle1 text-weight-medium text-negative q-mb-md">
                        ⚠️ Esta acción NO se puede deshacer
                    </div>
                    
                    <div v-if="loanToDelete" class="text-body1">
                        <strong>¿Estás seguro que deseas eliminar este préstamo?</strong>
                        
                        <div class="q-mt-md">
                            <strong>Ítem:</strong> {{ loanToDelete.item?.nombre }}<br>
                            <strong>Solicitante:</strong> {{ loanToDelete.usuario?.nombre }}<br>
                            <strong>Cantidad:</strong> {{ loanToDelete.cantidad_prestamo }}<br>
                            <strong>Estado:</strong> {{ loanToDelete.estado }}<br>
                            <strong>Fecha préstamo:</strong> {{ formatDate(loanToDelete.fecha_prestamo) }}
                        </div>
                        
                        <div class="text-caption text-negative q-mt-md">
                            <q-icon name="info" size="xs"/> 
                            El stock NO será restaurado automáticamente
                        </div>
                    </div>
                </q-card-section>

                <q-card-actions align="right" class="q-pa-md">
                    <q-btn 
                        flat 
                        label="Cancelar" 
                        color="grey" 
                        v-close-popup 
                        @click="loanToDelete = null"
                    />
                    <q-btn 
                        label="Eliminar Préstamo" 
                        color="negative" 
                        icon="delete"
                        @click="executeDelete"
                        :loading="submitting"
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- Estadísticas -->
        <div v-if="loans.length > 0" class="q-mt-lg text-center">
            <q-chip icon="check_circle" color="positive" text-color="white">
                {{ countByStatus('Aprobado') }} aprobado(s)
            </q-chip>
            <q-chip icon="event_repeat" color="orange" text-color="white">
                {{ countByStatus('Aplazado') }} aplazado(s)
            </q-chip>
            <q-chip icon="assignment_turned_in" color="blue" text-color="white">
                {{ countByStatus('Devuelto') }} devuelto(s)
            </q-chip>
            <q-chip icon="warning" color="negative" text-color="white">
                {{ overdueCount }} vencido(s)
            </q-chip>
        </div>
    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { loansService } from '../../services/items.js';
import * as XLSX from 'xlsx';

const $q = useQuasar();

// Estados reactivos
const loans = ref([]);
const loading = ref(false);
const error = ref(null);
const searchFilter = ref('');
const estadoFiltro = ref(null);

// Dialogs
const delayDialog = ref(false);
const detailDialog = ref(false);
const selectedLoan = ref(null);
const submitting = ref(false);
const delayForm = ref({
    nueva_fecha_estimada: ''
});

// Estados para diálogos de confirmación
const confirmReturnDialog = ref(false);
const confirmDeleteDialog = ref(false);
const loanToReturn = ref(null);
const loanToDelete = ref(null);

// Columnas de la tabla
const columns = [
    { 
        name: 'id', 
        required: true, 
        label: 'ID', 
        align: 'left', 
        field: '_id',
        sortable: true,
        format: val => val.slice(-6).toUpperCase(),
        style: 'width: 80px'
    },
    { 
        name: 'item', 
        align: 'left', 
        label: 'Ítem', 
        field: row => row.item?.nombre,
        sortable: true,
        style: 'min-width: 200px'
    },
    { 
        name: 'solicitante', 
        align: 'left', 
        label: 'Solicitante', 
        field: row => row.usuario?.nombre,
        sortable: true,
        style: 'min-width: 180px'
    },
    { 
        name: 'cantidad', 
        align: 'center', 
        label: 'Cant.', 
        field: 'cantidad_prestamo', 
        sortable: true,
        style: 'width: 80px'
    },
    { 
        name: 'fecha_prestamo', 
        align: 'center', 
        label: 'F. Préstamo', 
        field: 'fecha_prestamo', 
        sortable: true,
        style: 'min-width: 140px'
    },
    { 
        name: 'fecha_estimada', 
        align: 'center', 
        label: 'F. Devolución', 
        field: 'fecha_estimada', 
        sortable: true,
        style: 'min-width: 140px'
    },
    { 
        name: 'status', 
        align: 'center', 
        label: 'Estado', 
        field: 'estado', 
        sortable: true,
        style: 'width: 120px'
    },
    { 
        name: 'actions', 
        label: 'Acciones', 
        field: 'actions', 
        align: 'center',
        style: 'width: 180px'
    }
];

// Computed para préstamos filtrados
const filteredLoans = computed(() => {
    if (!estadoFiltro.value) return loans.value;
    return loans.value.filter(loan => loan.estado === estadoFiltro.value);
});

// Computed para préstamos vencidos
const overdueCount = computed(() => {
    return loans.value.filter(loan => isOverdue(loan)).length;
});

// Computed para fecha mínima de aplazamiento
const minDelayDate = computed(() => {
    if (!selectedLoan.value?.fecha_estimada) return '';
    const fecha = new Date(selectedLoan.value.fecha_estimada);
    fecha.setHours(fecha.getHours() + 1);
    return fecha.toISOString().slice(0, 16);
});

// Función para cargar préstamos
const loadLoans = async () => {
    loading.value = true;
    error.value = null;
    
    try {
        const data = await loansService.getAll();
        // Filtrar solo préstamos que no sean "Pendiente" (ya se muestran en solicitudes)
        loans.value = data.filter(loan => loan.estado !== 'Pendiente');
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

// Función para verificar si puede devolver
const canReturn = (loan) => {
    return ['Aprobado', 'Aplazado'].includes(loan.estado);
};

// Función para verificar si puede aplazar
const canDelay = (loan) => {
    return ['Aprobado', 'Aplazado'].includes(loan.estado) && loan.fecha_estimada;
};

// Función para obtener clase de fila
const getRowClass = (row) => {
    if (isOverdue(row)) {
        return 'loan-expired';
    }
    return '';
};

// Función para abrir diálogo de confirmación de devolución
const confirmReturn = (loan) => {
    loanToReturn.value = loan;
    confirmReturnDialog.value = true;
};

// Función para ejecutar la devolución
const executeReturn = async () => {
    if (!loanToReturn.value) return;
    
    submitting.value = true;
    
    try {
        await loansService.return(loanToReturn.value._id);

        $q.notify({
            type: 'positive',
            message: 'Préstamo devuelto exitosamente. Stock actualizado.',
            position: 'top',
            icon: 'check_circle',
            timeout: 3000
        });

        confirmReturnDialog.value = false;
        await loadLoans();

    } catch (err) {
        console.error('Error al devolver préstamo:', err);
        
        const errorMessage = err.response?.data?.message || 'No se pudo procesar la devolución';
        
        $q.notify({
            type: 'negative',
            message: errorMessage,
            position: 'top',
            icon: 'error',
            timeout: 4000
        });
    } finally {
        loanToReturn.value = null;
        submitting.value = false;
    }
};

// Función para abrir dialog de aplazamiento
const openDelayDialog = (loan) => {
    selectedLoan.value = loan;
    
    const defaultDate = new Date(loan.fecha_estimada);
    defaultDate.setDate(defaultDate.getDate() + 7);
    defaultDate.setMinutes(defaultDate.getMinutes() - defaultDate.getTimezoneOffset());
    delayForm.value.nueva_fecha_estimada = defaultDate.toISOString().slice(0, 16);
    
    delayDialog.value = true;
};

// Función para enviar aplazamiento
const submitDelay = async () => {
    if (!selectedLoan.value) return;

    submitting.value = true;

    try {
        const nuevaFechaISO = new Date(delayForm.value.nueva_fecha_estimada).toISOString();

        await loansService.delay(selectedLoan.value._id, nuevaFechaISO);

        $q.notify({
            type: 'positive',
            message: 'Préstamo aplazado exitosamente',
            position: 'top',
            icon: 'check_circle',
            timeout: 3000
        });

        delayDialog.value = false;
        await loadLoans();

    } catch (err) {
        console.error('Error al aplazar préstamo:', err);
        
        const errorMessage = err.response?.data?.message || 'No se pudo aplazar el préstamo';
        
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

// Función para abrir dialog de detalle
const openDetailDialog = (loan) => {
    selectedLoan.value = loan;
    detailDialog.value = true;
};

// Función para abrir diálogo de confirmación de eliminación
const confirmDelete = (loan) => {
    loanToDelete.value = loan;
    confirmDeleteDialog.value = true;
};

// Función para ejecutar la eliminación
const executeDelete = async () => {
    if (!loanToDelete.value) return;
    
    submitting.value = true;
    
    try {
        await loansService.delete(loanToDelete.value._id);

        $q.notify({
            type: 'info',
            message: 'Préstamo eliminado exitosamente',
            position: 'top',
            icon: 'delete',
            timeout: 3000
        });

        confirmDeleteDialog.value = false;
        await loadLoans();

    } catch (err) {
        console.error('Error al eliminar préstamo:', err);
        
        const errorMessage = err.response?.data?.message || 'No se pudo eliminar el préstamo';
        
        $q.notify({
            type: 'negative',
            message: errorMessage,
            position: 'top',
            icon: 'error',
            timeout: 4000
        });
    } finally {
        loanToDelete.value = null;
        submitting.value = false;
    }
};

// Función para contar por estado
const countByStatus = (status) => {
    return loans.value.filter(loan => loan.estado === status).length;
};

// Función para exportar a Excel
const exportToExcel = () => {
    try {
        const excelData = filteredLoans.value.map(loan => ({
            'ID': loan._id.slice(-8).toUpperCase(),
            'Ítem': loan.item?.nombre || 'N/A',
            'Aula': loan.aula?.nombre || 'N/A',
            'Solicitante': loan.usuario?.nombre || 'N/A',
            'Email': loan.usuario?.email || 'N/A',
            'Cantidad': loan.cantidad_prestamo,
            'Fecha Solicitud': formatDateExcel(loan.fecha_solicitud),
            'Fecha Préstamo': formatDateExcel(loan.fecha_prestamo),
            'Fecha Estimada Devolución': formatDateExcel(loan.fecha_estimada),
            'Fecha Real Devolución': formatDateExcel(loan.fecha_retorno),
            'Estado': loan.estado,
            'Vencido': isOverdue(loan) ? 'SÍ' : 'NO'
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        const columnWidths = [
            { wch: 10 }, { wch: 30 }, { wch: 20 }, { wch: 25 }, { wch: 30 },
            { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 25 },
            { wch: 12 }, { wch: 10 }
        ];
        ws['!cols'] = columnWidths;
        XLSX.utils.book_append_sheet(wb, ws, 'Préstamos');
        
        const fecha = new Date().toISOString().split('T')[0];
        const filtroEstado = estadoFiltro.value ? `_${estadoFiltro.value}` : '';
        const fileName = `Prestamos${filtroEstado}_${fecha}.xlsx`;
        XLSX.writeFile(wb, fileName);

        $q.notify({
            type: 'positive',
            message: 'Excel descargado exitosamente',
            caption: `${excelData.length} préstamo(s) exportado(s)`,
            position: 'top',
            icon: 'download',
            timeout: 3000
        });
    } catch (error) {
        console.error('Error exportando a Excel:', error);
        $q.notify({
            type: 'negative',
            message: 'Error al exportar a Excel',
            position: 'top',
            icon: 'error',
            timeout: 3000
        });
    }
};

const formatDateExcel = (dateString) => {
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

onMounted(() => {
    loadLoans();
    setInterval(loadLoans, 30000);
});
</script>

<style scoped>
.bg-grey-2 {
    background-color: #f0f4f8;
}

.prestamos-card {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.prestamos-table {
    border-radius: 12px;
}

.prestamos-table :deep(.q-table__top) {
    background-color: #f8f9fa;
    border-bottom: 2px solid #e0e0e0;
    padding: 16px;
}

.prestamos-table :deep(.q-table__title) {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1976d2;
}

.prestamos-table :deep(thead tr th) {
    background-color: #1976d2 !important;
    color: white !important;
    font-weight: 600 !important;
    font-size: 0.875rem !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px;
    padding: 12px 8px !important;
    border: none !important;
}

.prestamos-table :deep(tbody tr) {
    transition: all 0.2s ease;
}

.prestamos-table :deep(tbody tr:hover) {
    background-color: #f5f5f5 !important;
    transform: scale(1.001);
}

.prestamos-table :deep(tbody tr td) {
    padding: 12px 8px !important;
    border-bottom: 1px solid #e0e0e0 !important;
    vertical-align: middle !important;
}

.loan-expired {
    background-color: #ffebee !important;
}

.loan-expired :deep(td) {
    color: #c62828 !important;
    font-weight: 500 !important;
}

.loan-expired .q-badge {
    color: white !important;
}

.search-input {
    background-color: white;
    border-radius: 20px;
    padding: 2px 12px;
    min-width: 250px;
}

.prestamos-table :deep(.q-btn) {
    transition: all 0.2s ease;
}

.prestamos-table :deep(.q-btn:hover) {
    transform: scale(1.15);
}

.prestamos-table :deep(.q-chip) {
    font-weight: 500;
}

.prestamos-table :deep(.q-badge) {
    font-weight: 600;
    letter-spacing: 0.5px;
}

@media (max-width: 768px) {
    .prestamos-table {
        font-size: 0.85rem;
    }
    
    .search-input {
        min-width: 150px;
    }
}

.prestamos-table :deep(.q-linear-progress) {
    height: 3px;
}
</style>