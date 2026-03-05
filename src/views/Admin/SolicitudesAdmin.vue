<template>
    <q-page class="page-bg q-pa-md">

        <!-- Header -->
        <div class="row items-center q-mb-md">
            <div class="header-icon-wrap q-mr-sm">
                <q-icon name="pending_actions" size="22px" color="white"/>
            </div>
            <div>
                <div class="text-h6 text-weight-bold text-dark">Solicitudes Pendientes</div>
                <div class="text-caption text-grey-6">Aprobar o rechazar solicitudes de préstamo</div>
            </div>
            <q-space/>
            <q-btn outline color="primary" icon="refresh" label="Actualizar" dense no-caps
                @click="loadRequests" :loading="loading"/>
        </div>

        <!-- Error -->
        <div v-if="error" class="column items-center q-py-xl">
            <q-icon name="error_outline" size="56px" color="negative" class="q-mb-md"/>
            <div class="text-body1 text-negative">{{ error }}</div>
            <q-btn color="primary" label="Reintentar" @click="loadRequests" class="q-mt-md" unelevated/>
        </div>

        <!-- Empty -->
        <q-card v-else-if="!loading && pendingRequests.length === 0" flat class="q-pa-xl text-center">
            <q-icon name="check_circle" size="64px" color="positive" class="q-mb-md"/>
            <div class="text-h6 text-positive">¡Todo al día!</div>
            <div class="text-body1 text-grey-6">No hay solicitudes pendientes</div>
        </q-card>

        <!-- Table -->
        <q-card v-else flat class="table-card">
            <q-card-section class="row items-center q-pb-sm">
                <div class="text-subtitle2 text-weight-bold">
                    Solicitudes
                    <q-badge color="orange" :label="pendingRequests.length" class="q-ml-xs"/>
                </div>
                <q-space/>
                <q-input outlined dense debounce="300" v-model="filter" placeholder="Buscar..." style="max-width:240px;">
                    <template v-slot:prepend><q-icon name="search"/></template>
                </q-input>
            </q-card-section>
            <q-separator/>
            <q-table
                :rows="pendingRequests" :columns="columns"
                row-key="_id" :filter="filter" :loading="loading"
                :rows-per-page-options="[10, 25, 50]"
                no-data-label="No hay solicitudes" flat>

                <template v-slot:body-cell-id="props">
                    <q-td :props="props">
                        <span class="text-weight-bold" style="font-family:monospace;font-size:12px;">
                            #{{ props.row._id.slice(-6).toUpperCase() }}
                        </span>
                    </q-td>
                </template>

                <template v-slot:body-cell-items="props">
                    <q-td :props="props">
                        <div v-for="li in props.row.items" :key="li._id" class="q-mb-xs">
                            <div class="row items-center no-wrap" style="gap:4px;">
                                <span class="text-weight-medium text-dark">{{ li.item?.nombre }}</span>
                                <q-badge outline color="grey-6" style="font-size:9px;">{{ li.aula?.nombre }}</q-badge>
                            </div>
                            <div class="text-caption text-grey-6">
                                {{ li.cantidad_prestamo }} ud. ·
                                <span :class="(li.item?.cantidad_disponible || 0) > 0 ? 'text-positive' : 'text-negative'">
                                    stock: {{ li.item?.cantidad_disponible ?? 'N/A' }}
                                </span>
                            </div>
                        </div>
                    </q-td>
                </template>

                <template v-slot:body-cell-solicitante="props">
                    <q-td :props="props">
                        <div class="text-weight-medium">{{ props.row.usuario?.nombre }}</div>
                        <div class="text-caption text-grey-6">{{ props.row.usuario?.email }}</div>
                    </q-td>
                </template>

                <template v-slot:body-cell-fecha_solicitud="props">
                    <q-td :props="props" class="text-center">
                        <div class="text-caption">{{ formatDate(props.row.fecha_solicitud) }}</div>
                    </q-td>
                </template>

                <template v-slot:body-cell-fecha_sugerida="props">
                    <q-td :props="props" class="text-center">
                        <div v-if="props.row.fecha_sugerida_usuario" class="text-caption">
                            {{ formatDate(props.row.fecha_sugerida_usuario) }}
                        </div>
                        <div v-else class="text-caption text-grey-5">No indicada</div>
                    </q-td>
                </template>

                <template v-slot:body-cell-actions="props">
                    <q-td :props="props">
                        <q-btn icon="thumb_up" label="Aprobar" color="positive" size="sm" flat dense
                            @click="openApproveDialog(props.row)"/>
                        <q-btn icon="thumb_down" label="Rechazar" color="negative" size="sm" flat dense
                            class="q-ml-sm" @click="confirmReject(props.row)"/>
                    </q-td>
                </template>
            </q-table>
        </q-card>

        <!-- ── Dialog Aprobar ── -->
        <q-dialog v-model="approveDialog" persistent>
            <q-card style="width:600px;max-width:98%">
                <q-toolbar class="bg-positive text-white">
                    <q-icon name="thumb_up" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">Aprobar Solicitud</q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>

                <q-card-section class="q-pt-md">
                    <div class="text-subtitle2 q-mb-xs text-grey-8">
                        <q-icon name="person" size="sm" class="q-mr-xs" color="primary"/>
                        <strong>{{ selectedRequest?.usuario?.nombre }}</strong>
                        <span class="text-caption text-grey-6 q-ml-sm">{{ selectedRequest?.usuario?.email }}</span>
                    </div>

                    <q-banner v-if="selectedRequest?.fecha_sugerida_usuario" rounded
                        class="bg-green-9-1 text-green-10 q-mb-sm" dense>
                        <template v-slot:avatar><q-icon name="event" color="purple"/></template>
                        <strong>Fecha sugerida por el usuario:</strong>
                        {{ formatDate(selectedRequest.fecha_sugerida_usuario) }}
                    </q-banner>

                    <q-banner v-if="selectedRequest?.observacion_solicitud" rounded
                        class="bg-blue-grey-1 text-blue-grey-9 q-mb-sm" dense>
                        <template v-slot:avatar><q-icon name="comment" color="blue-grey"/></template>
                        <strong>Observación del usuario:</strong> {{ selectedRequest.observacion_solicitud }}
                    </q-banner>

                    <div class="text-subtitle2 text-grey-8 q-mb-sm q-mt-sm">
                        <q-icon name="inventory" size="sm" class="q-mr-xs" color="primary"/>
                        Ítems del préstamo
                    </div>

                    <div v-for="li in approvalItems" :key="li._id" class="item-edit-row q-mb-sm"
                        :class="{ 'item-removed': li._toRemove }">
                        <div class="row items-center q-gutter-sm">
                            <q-btn round flat dense size="sm"
                                :icon="li._toRemove ? 'add_circle' : 'remove_circle'"
                                :color="li._toRemove ? 'positive' : 'negative'"
                                @click="toggleRemoveItem(li)">
                                <q-tooltip>{{ li._toRemove ? 'Restaurar ítem' : 'Eliminar ítem del préstamo' }}</q-tooltip>
                            </q-btn>

                            <div class="col">
                                <div class="row items-center">
                                    <span class="text-weight-medium text-body2 q-mr-sm"
                                        :class="li._toRemove ? 'text-grey-5 text-strike' : 'text-dark'">
                                        {{ li.item?.nombre || 'N/A' }}
                                    </span>
                                    <q-badge outline color="grey-6" class="text-caption">
                                        {{ li.aula?.nombre || 'N/A' }}
                                    </q-badge>
                                </div>
                                <div class="text-caption text-grey-6">
                                    Solicitado: <strong class="text-primary">{{ li.cantidad_prestamo }} ud.</strong>
                                    &nbsp;·&nbsp; Stock disponible:
                                    <span :class="(li.item?.cantidad_disponible || 0) > 0 ? 'text-positive' : 'text-negative'">
                                        <strong>{{ li.item?.cantidad_disponible ?? 'N/A' }}</strong>
                                    </span>
                                </div>
                                <div v-if="!li._toRemove && li._cantAprobada === 0"
                                    class="text-caption text-orange-8 row items-center q-mt-xs">
                                    <q-icon name="info" size="12px" class="q-mr-xs"/>
                                    Cantidad 0 → el ítem será eliminado del préstamo al aprobar
                                </div>
                            </div>

                            <!-- Input cantidad aprobada -->
                            <div v-if="!li._toRemove" style="min-width:155px">
                                <q-input
                                    v-model.number="li._cantAprobada"
                                    type="number" dense outlined
                                    label="Cant. aprobada"
                                    :min="0"
                                    :max="li.cantidad_prestamo"
                                    color="positive"
                                    :color-input="li._cantAprobada === 0 ? 'orange' : 'positive'"
                                    @keydown="e => ['.', ',', 'e', 'E', '+', '-'].includes(e.key) && e.preventDefault()"
                                    :rules="[
                                        val => (val !== null && val !== undefined && val !== '') || 'Requerido',
                                        val => Number.isInteger(Number(val)) || 'Solo enteros',
                                        val => Number(val) >= 0 || 'Mínimo 0',
                                        val => Number(val) <= li.cantidad_prestamo || `Máx: ${li.cantidad_prestamo}`
                                    ]"
                                    hide-bottom-space>
                                    <template v-slot:append>
                                        <span class="text-caption text-grey-5">/ {{ li.cantidad_prestamo }}</span>
                                    </template>
                                </q-input>
                                <div v-if="li._cantAprobada > 0 && li._cantAprobada < li.cantidad_prestamo"
                                    class="text-caption text-orange-8 q-mt-xs row items-center no-wrap">
                                    <q-icon name="info" size="12px" class="q-mr-xs"/>
                                    {{ li._cantAprobada }} de {{ li.cantidad_prestamo }} ud. aprobadas
                                </div>
                            </div>
                            <div v-else class="text-caption text-negative text-weight-medium">Eliminado</div>
                        </div>

                        <div v-if="li.observacion_item && !li._toRemove" class="text-caption text-grey-6 q-ml-xl q-mt-xs">
                            💬 {{ li.observacion_item }}
                        </div>

                        <q-banner v-if="!li._toRemove && (li.item?.cantidad_disponible || 0) === 0"
                            class="bg-negative text-white q-mt-xs" dense rounded>
                            <template v-slot:avatar><q-icon name="warning" color="white" size="16px"/></template>
                            <div class="text-caption">Sin stock disponible. Se recomienda poner 0 o eliminar este ítem.</div>
                        </q-banner>
                        <q-banner v-else-if="!li._toRemove && li._cantAprobada > 0 && li._cantAprobada > (li.item?.cantidad_disponible ?? 0)"
                            class="bg-orange-2 text-orange-9 q-mt-xs" dense rounded>
                            <template v-slot:avatar><q-icon name="warning" color="orange-9" size="16px"/></template>
                            <div class="text-caption">
                                Stock insuficiente: solo hay <strong>{{ li.item?.cantidad_disponible }}</strong> disponible(s).
                            </div>
                        </q-banner>
                    </div>

                    <q-form @submit.prevent="submitApproval" class="q-gutter-md q-mt-md">
                        <template v-if="todoConsumible">
                            <q-banner rounded class="bg-green-1 text-green-10" dense>
                                <template v-slot:avatar><q-icon name="recycling" color="primary" size="18px"/></template>
                                <div class="text-caption">
                                    <strong>Préstamo de solo consumibles.</strong> No se requiere fecha de devolución.
                                </div>
                            </q-banner>
                        </template>
                        <template v-else>
                            <q-input v-model="approvalForm.fecha_estimada" filled
                                label="Fecha y hora de devolución estipulada *"
                                type="datetime-local" color="positive"
                                :min="minReturnDate"
                                :rules="[
                                    val => !!val || 'Fecha requerida',
                                    val => new Date(val) > new Date() || 'La fecha debe ser futura'
                                ]">
                                <template v-slot:prepend><q-icon name="event" color="positive"/></template>
                            </q-input>
                        </template>

                        <q-input v-model="approvalForm.observacion_aprobacion"
                            label="Nota para el usuario (opcional)"
                            hint="El usuario verá esta nota en el correo de aprobación"
                            type="textarea" rows="2" filled color="positive" counter maxlength="500">
                            <template v-slot:prepend><q-icon name="comment" color="positive"/></template>
                        </q-input>

                        <q-banner class="bg-green-1 text-green-9" rounded dense>
                            <template v-slot:avatar><q-icon name="info" color="green" size="18px"/></template>
                            <div class="text-caption">
                                Se aprobarán
                                <strong>{{ effectiveActiveItems.length }}</strong> ítem(s).
                                <span v-if="zeroQtyItems.length > 0" class="text-orange-9 q-ml-xs">
                                    {{ zeroQtyItems.length }} ítem(s) con cantidad 0 serán eliminados.
                                </span>
                                <span v-if="approvalItems.some(li => li._toRemove)" class="text-negative q-ml-xs">
                                    {{ approvalItems.filter(li => li._toRemove).length }} ítem(s) marcados para eliminar.
                                </span>
                                <span v-if="approvalItems.some(li => !li._toRemove && li._cantAprobada > 0 && li._cantAprobada < li.cantidad_prestamo)" class="text-orange-9 q-ml-xs">
                                    Algunos ítems con cantidad reducida.
                                </span>
                            </div>
                        </q-banner>

                        <q-card-actions align="right" class="q-mt-sm q-pb-none">
                            <q-btn flat label="Cancelar" color="grey" v-close-popup/>
                            <q-btn label="Aprobar Préstamo" type="submit" color="positive"
                                icon="check_circle" :loading="submitting" :disable="hasValidationErrors"/>
                        </q-card-actions>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>

        <!-- Dialog Rechazar -->
        <q-dialog v-model="rejectDialog" persistent>
            <q-card style="width:95vw;max-width:460px">
                <q-toolbar class="bg-negative text-white">
                    <q-icon name="thumb_down" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">Rechazar Solicitud</q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>
                <q-card-section class="q-pt-md">
                    <p>
                        Rechazar la solicitud de
                        <strong>{{ requestToReject?.usuario?.nombre }}</strong>
                        con <strong>{{ requestToReject?.items?.length || 0 }} ítem(s)</strong>?
                    </p>
                    <div class="q-mb-sm">
                        <div class="text-subtitle2 text-grey-7 q-mb-xs">
                            Motivo del rechazo <span class="text-grey-5 text-caption">(opcional pero recomendado)</span>
                        </div>
                        <q-input v-model="rejectForm.observacion" type="textarea" outlined dense
                            rows="3" maxlength="500" counter
                            placeholder="Ej: No hay stock disponible."/>
                    </div>
                    <q-banner rounded class="bg-orange-1 text-orange-9" dense>
                        <template v-slot:avatar><q-icon name="info" color="orange"/></template>
                        El usuario recibirá un email con el motivo indicado.
                    </q-banner>
                </q-card-section>
                <q-card-actions align="right" class="q-px-md q-pb-md">
                    <q-btn flat label="Cancelar" color="grey" v-close-popup/>
                    <q-btn unelevated label="Rechazar Solicitud" color="negative" icon="thumb_down"
                        :loading="rejecting" @click="rejectRequest(requestToReject)"/>
                </q-card-actions>
            </q-card>
        </q-dialog>

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

const pendingRequests = ref([]);
const loading  = ref(false);
const error    = ref(null);
const filter   = ref('');

const approveDialog   = ref(false);
const selectedRequest = ref(null);
const submitting      = ref(false);
const approvalItems   = ref([]);
const approvalForm    = ref({ fecha_estimada: '', observacion_aprobacion: '' });

const rejectDialog    = ref(false);
const requestToReject = ref(null);
const rejecting       = ref(false);
const rejectForm      = ref({ observacion: '' });

const columns = [
    { name: 'id',             required: true, label: 'ID',              align: 'left',   field: '_id',                           sortable: true,  format: v => v.slice(-6).toUpperCase() },
    { name: 'items',          align: 'left',  label: 'Equipos / Ítems', field: 'items',  sortable: false },
    { name: 'solicitante',    align: 'left',  label: 'Solicitante',     field: r => r.usuario?.nombre, sortable: true },
    { name: 'fecha_solicitud',align: 'center',label: 'F. Solicitud',    field: 'fecha_solicitud',      sortable: true },
    { name: 'fecha_sugerida', align: 'center',label: 'F. Sugerida',     field: 'fecha_sugerida_usuario', sortable: true },
    { name: 'actions',        label: 'Acciones', field: 'actions',      align: 'center' },
];

const minReturnDate = computed(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
});

/** true si todos los ítems activos (no eliminados) son Consumibles */
const todoConsumible = computed(() =>
    approvalItems.value.length > 0 &&
    approvalItems.value
        .filter(li => !li._toRemove)
        .every(li => li.item?.tipo_categoria === 'Consumible')
);

/**
 * Ítems que el admin tiene activos (no marcados _toRemove) y con cantidad > 0.
 * Los de cantidad = 0 se tratan como si los quitara (el backend los eliminará).
 */
const effectiveActiveItems = computed(() =>
    approvalItems.value.filter(li => !li._toRemove && li._cantAprobada > 0)
);

/** Ítems no marcados para eliminar pero con cantidad = 0 (se eliminarán implícitamente). */
const zeroQtyItems = computed(() =>
    approvalItems.value.filter(li => !li._toRemove && li._cantAprobada === 0)
);

/**
 * Bloquea el botón Aprobar si:
 * - No quedaría ningún ítem activo con cantidad ≥ 1
 * - Algún ítem activo tiene valor vacío, no entero, negativo o mayor al solicitado
 */
const hasValidationErrors = computed(() => {
    if (effectiveActiveItems.value.length === 0) return true;
    // Fecha requerida solo si hay ítems no-consumibles
    if (!todoConsumible.value && !approvalForm.value.fecha_estimada) return true;
    return approvalItems.value
        .filter(li => !li._toRemove)
        .some(li => {
            const v = Number(li._cantAprobada);
            return li._cantAprobada === null || li._cantAprobada === undefined || li._cantAprobada === ''
                || isNaN(v)
                || !Number.isInteger(v)
                || v < 0
                || v > li.cantidad_prestamo;
        });
});

const loadRequests = async () => {
    loading.value = true;
    error.value   = null;
    try {
        const data = await loansService.getAll({ estado: 'Pendiente' });
        pendingRequests.value = data;
        if (data.length === 0)
            $q.notify({ type: 'positive', message: 'No hay solicitudes pendientes', position: 'top', timeout: 2000 });
    } catch (err) {
        error.value = 'Error al cargar las solicitudes.';
        $q.notify({ type: 'negative', message: 'No se pudieron cargar las solicitudes', position: 'top', timeout: 3000 });
    } finally {
        loading.value = false;
    }
};

const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleString('es-CO', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
};

const openApproveDialog = (request) => {
    selectedRequest.value = request;
    approvalItems.value = (request.items || []).map(li => ({
        ...li,
        _cantAprobada: li.cantidad_prestamo,   // por defecto: lo que pidió
        _toRemove:     false,
    }));
    approvalForm.value.observacion_aprobacion = '';
    approveDialog.value = true;

    // Pre-llenar fecha solo si hay ítems no consumibles
    const hayNoConsumible = (request.items || []).some(li => li.item?.tipo_categoria !== 'Consumible');
    if (hayNoConsumible) {
        if (request.fecha_sugerida_usuario) {
            const d = new Date(request.fecha_sugerida_usuario);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            approvalForm.value.fecha_estimada = d.toISOString().slice(0, 16);
        } else {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            approvalForm.value.fecha_estimada = d.toISOString().slice(0, 16);
        }
    } else {
        approvalForm.value.fecha_estimada = '';
    }
};

const toggleRemoveItem = (li) => { li._toRemove = !li._toRemove; };

const submitApproval = async () => {
    if (!selectedRequest.value) return;

    if (effectiveActiveItems.value.length === 0) {
        $q.notify({ type: 'warning', message: 'Debes mantener al menos 1 ítem con cantidad ≥ 1 en el préstamo', position: 'top', timeout: 3500 });
        return;
    }

    // Validación de stock solo para ítems activos con cantidad > 0
    for (const li of effectiveActiveItems.value) {
        if ((li.item?.cantidad_disponible ?? 0) < li._cantAprobada) {
            $q.notify({
                type: 'warning',
                message: `Stock insuficiente para "${li.item?.nombre}". Disponible: ${li.item?.cantidad_disponible}`,
                position: 'top', timeout: 4000
            });
            return;
        }
    }

    submitting.value = true;
    try {
        // Los ítems con cantidad = 0 se envían como itemsToRemove (igual que _toRemove)
        const itemsToRemove = [
            ...approvalItems.value.filter(li => li._toRemove).map(li => li._id),
            ...zeroQtyItems.value.map(li => li._id),
        ];
        const approvals = effectiveActiveItems.value.map(li => ({
            loanItemId:       li._id,
            cantidad_aprobada: li._cantAprobada,
        }));

        await loansService.approve(selectedRequest.value._id, {
            ...(approvalForm.value.fecha_estimada
                ? { fecha_estimada: new Date(approvalForm.value.fecha_estimada).toISOString() }
                : {}),
            approvals,
            itemsToRemove,
            observacion_aprobacion: approvalForm.value.observacion_aprobacion || undefined,
        });

        $q.notify({ type: 'positive', message: '✅ Préstamo aprobado exitosamente', position: 'top', timeout: 3000 });
        approveDialog.value = false;
        await loadRequests();
    } catch (err) {
        $q.notify({ type: 'negative', message: err?.response?.data?.message || 'No se pudo aprobar el préstamo', position: 'top', timeout: 4000 });
    } finally {
        submitting.value = false;
    }
};

const confirmReject = (request) => {
    requestToReject.value = request;
    rejectForm.value.observacion = '';
    rejectDialog.value = true;
};

const rejectRequest = async (request) => {
    if (!request) return;
    rejecting.value = true;
    try {
        await loansService.reject(request._id, rejectForm.value.observacion || undefined);
        $q.notify({ type: 'info', message: 'Solicitud rechazada', position: 'top', timeout: 3000 });
        rejectDialog.value = false;
        await loadRequests();
    } catch (err) {
        $q.notify({ type: 'negative', message: err?.response?.data?.message || 'No se pudo rechazar', position: 'top', timeout: 4000 });
    } finally {
        rejecting.value = false;
        requestToReject.value = null;
    }
};

onMounted(loadRequests);
</script>

<style scoped>
.page-bg { background: #f0f0f0; min-height: 100vh; }
.header-icon-wrap {
    width: 38px; height: 38px; border-radius: 10px;
    background: linear-gradient(135deg, #F4A010, #F4A010);
    display: flex; align-items: center; justify-content: center;
}
.table-card { border-radius: 14px; border: 1px solid #e0e0e0; overflow: hidden; }

.item-edit-row {
    border: 1.5px solid #e0e0e0;
    border-radius: 10px;
    padding: 10px 12px;
    background: white;
    transition: background .15s;
}
.item-removed {
    background: #fff5f5;
    border-color: #fecaca;
    opacity: .75;
}
.text-strike { text-decoration: line-through; }
</style>