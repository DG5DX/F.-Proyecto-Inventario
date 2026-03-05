<template>
    <q-page class="page-bg q-pa-md q-pa-sm-xs">

        <!-- ── Header ──────────────────────────────────────────────── -->
        <div class="row items-center q-mb-md q-gutter-sm">
            <div class="row items-center col-12 col-sm-auto">
                <div class="header-icon-wrap q-mr-sm">
                    <q-icon name="category" size="20px" color="white"/>
                </div>
                <div>
                    <div class="text-h6 text-weight-bold text-dark lh-tight">Gestión de Sedes</div>
                    <div class="text-caption text-grey-6">Administra las sedes del inventario</div>
                </div>
            </div>
            <q-space class="gt-xs"/>
            <q-btn
                outline color="primary"
                icon="refresh"
                label="Actualizar"
                dense no-caps
                @click="loadZones"
                :loading="loading"
                class="action-btn"
            />
        </div>

        <!-- ── Stat chip ────────────────────────────────────────────── -->
        <div v-if="zones.length > 0" class="row q-col-gutter-sm q-mb-md">
            <div class="col-4">
                <div class="stat-chip stat-chip--blue">
                    <q-icon name="category" size="18px"/>
                    <div>
                        <div class="stat-number">{{ zones.length }}</div>
                        <div class="stat-label">Sedes</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Loading / Error ──────────────────────────────────────── -->
        <div v-if="loading && !zones.length" class="text-center q-py-xl">
            <q-spinner-dots size="56px" color="primary"/>
            <div class="text-body2 text-grey-6 q-mt-md">Cargando sedes...</div>
        </div>

        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="56px" color="negative" class="q-mb-md"/>
            <div class="text-body1 text-negative">{{ error }}</div>
            <q-btn color="primary" label="Reintentar" @click="loadZones" class="q-mt-md" unelevated/>
        </div>

        <!-- ── Table card ────────────────────────────────────────────── -->
        <q-card v-else class="table-card" flat>
            <q-table
                :rows="zones"
                :columns="zoneColumns"
                row-key="_id"
                flat
                :rows-per-page-options="[10, 25, 50, 0]"
                no-data-label="No hay sedes registradas"
                class="zones-table"
            >
                <template v-slot:top>
                    <div class="row full-width items-center q-px-sm q-py-sm q-gutter-sm">
                        <div class="text-subtitle2 text-weight-bold text-dark col-auto">
                            Listado de sedes
                            <q-badge v-if="zones.length" color="primary" class="q-ml-xs" :label="zones.length"/>
                        </div>
                        <q-space/>
                        <q-btn
                            color="primary"
                            icon="add"
                            label="Crear Sede"
                            unelevated dense no-caps
                            @click="openCreateDialog"
                            style="border-radius:8px;"
                        />
                    </div>
                </template>

                <template v-slot:body-cell-nombre="props">
                    <q-td :props="props">
                        <div class="row no-wrap items-center" style="gap:10px;">
                            <div class="zone-avatar">
                                <q-icon name="category" size="20px" color="white"/>
                            </div>
                            <div>
                                <div class="text-weight-semibold cell-primary">{{ props.row.nombre }}</div>
                                <div v-if="props.row.descripcion" class="cell-secondary desc-clamp">{{ props.row.descripcion }}</div>
                            </div>
                        </div>
                    </q-td>
                </template>

                <template v-slot:body-cell-fecha="props">
                    <q-td :props="props">
                        <span class="cell-secondary">{{ formatDate(props.row.createdAt) }}</span>
                    </q-td>
                </template>

                <template v-slot:body-cell-acciones="props">
                    <q-td :props="props">
                        <div class="row no-wrap justify-center" style="gap:2px;">
                            <q-btn icon="edit" color="primary" size="sm" round flat dense @click="openEditDialog(props.row)">
                                <q-tooltip>Editar sede</q-tooltip>
                            </q-btn>
                            <q-btn icon="delete" color="negative" size="sm" round flat dense @click="confirmDelete(props.row)">
                                <q-tooltip>Eliminar sede</q-tooltip>
                            </q-btn>
                        </div>
                    </q-td>
                </template>

                <template v-slot:no-data>
                    <div class="full-width text-center q-py-xl">
                        <q-icon name="category" size="56px" color="grey-4" class="q-mb-md"/>
                        <div class="text-body1 text-grey-6">No hay sedes registradas</div>
                        <div class="text-caption text-grey-5 q-mt-xs">Crea tu primera sede para comenzar a organizar el inventario</div>
                    </div>
                </template>
            </q-table>
        </q-card>

        <!-- ── Dialog Crear / Editar ────────────────────────────────── -->
        <q-dialog v-model="zoneDialog" persistent>
            <q-card style="width: 450px; max-width: 95%;">
                <q-toolbar :class="isEditing ? 'bg-green-9' : 'bg-primary'" class="text-white">
                    <q-icon name="category" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">
                        {{ isEditing ? 'Editar Sede' : 'Crear Nueva Sede' }}
                    </q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>

                <q-card-section class="q-pt-md">
                    <q-form @submit.prevent="submitZone" class="q-gutter-md">
                        <q-input
                            v-model="zoneForm.nombre"
                            label="Nombre de la Sede"
                            outlined dense autofocus counter maxlength="150"
                            :rules="[
                                val => !!val || 'El nombre es obligatorio',
                                val => val.length >= 3 || 'Mínimo 3 caracteres'
                            ]"
                        >
                            <template v-slot:prepend><q-icon name="label"/></template>
                        </q-input>

                        <q-input
                            v-model="zoneForm.descripcion"
                            label="Descripción"
                            type="textarea" rows="3"
                            outlined dense counter maxlength="500"
                            hint="Describe el propósito o características de esta sede"
                        >
                            <template v-slot:prepend><q-icon name="description"/></template>
                        </q-input>

                        <q-card-actions align="right" class="q-mt-lg q-pb-none">
                            <q-btn flat label="Cancelar" color="grey" v-close-popup/>
                            <q-btn
                                type="submit"
                                :label="isEditing ? 'Guardar Cambios' : 'Crear Sede'"
                                :color="isEditing ? 'green-9' : 'primary'"
                                :icon="isEditing ? 'save' : 'add'"
                                :loading="submitting"
                            />
                        </q-card-actions>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>

        <!-- ── Dialog Eliminar ───────────────────────────────────────── -->
        <q-dialog v-model="deleteDialog" persistent>
            <q-card style="width: 90vw; max-width: 450px;">
                <q-card-section class="row items-center">
                    <q-avatar icon="delete" color="negative" text-color="white"/>
                    <span class="q-ml-sm text-h6">Eliminar Sede</span>
                </q-card-section>
                <q-card-section>
                    <div class="text-body1 q-mb-md">
                        ¿Estás seguro que deseas eliminar la sede
                        <strong>"{{ itemToDelete?.nombre }}"</strong>?
                    </div>
                    <q-banner class="bg-negative-1 text-negative" rounded dense>
                        <template v-slot:avatar><q-icon name="warning" color="negative"/></template>
                        Esta acción no se puede deshacer.
                    </q-banner>
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="grey" v-close-popup/>
                    <q-btn flat label="Eliminar" color="negative" icon="delete" @click="deleteZone(itemToDelete)"/>
                </q-card-actions>
            </q-card>
        </q-dialog>

    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { zonesService } from '../../services/items.js';

const $q = useQuasar();

const zones = ref([]);
const loading = ref(false);
const error = ref(null);

const zoneDialog = ref(false);
const selectedZone = ref(null);
const submitting = ref(false);
const zoneForm = ref({ nombre: '', descripcion: '' });

const deleteDialog = ref(false);
const itemToDelete = ref(null);

const isEditing = computed(() => !!selectedZone.value);

const zoneColumns = [
    { name: 'nombre',   label: 'Sede',          align: 'left',   field: 'nombre',    sortable: true, style: 'min-width: 250px' },
    { name: 'fecha',    label: 'Fecha creación', align: 'left',   field: 'createdAt', sortable: true, style: 'min-width: 160px' },
    { name: 'acciones', label: 'Acciones',       align: 'center', field: 'acciones',                  style: 'width: 100px' }
];

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
};

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

const openCreateDialog = () => {
    selectedZone.value = null;
    zoneForm.value = { nombre: '', descripcion: '' };
    zoneDialog.value = true;
};

const openEditDialog = (zone) => {
    selectedZone.value = zone;
    zoneForm.value = { nombre: zone.nombre, descripcion: zone.descripcion || '' };
    zoneDialog.value = true;
};

const submitZone = async () => {
    submitting.value = true;
    try {
        if (isEditing.value) {
            await zonesService.update(selectedZone.value._id, zoneForm.value);
            $q.notify({ type: 'info', message: 'Sede actualizada exitosamente', position: 'top', icon: 'upload', timeout: 2500 });
        } else {
            await zonesService.create(zoneForm.value);
            $q.notify({ type: 'positive', message: 'Sede creada exitosamente', position: 'top', icon: 'check_circle', timeout: 2500 });
        }
        zoneDialog.value = false;
        await loadZones();
    } catch (err) {
        let errorMessage = 'No se pudo guardar la sede';
        if (err.response?.status === 409 || err.response?.data?.message?.includes('duplicate')) {
            errorMessage = 'Ya existe una sede con ese nombre';
        } else if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
        }
        $q.notify({ type: 'negative', message: errorMessage, position: 'top', icon: 'error', timeout: 4000 });
    } finally {
        submitting.value = false;
    }
};

const confirmDelete = (item) => {
    itemToDelete.value = item;
    deleteDialog.value = true;
};

const deleteZone = async (zone) => {
    if (!itemToDelete.value) return;
    try {
        await zonesService.delete((zone || itemToDelete.value)._id);
        $q.notify({ type: 'warning', message: 'Sede eliminada exitosamente', position: 'top', icon: 'report_problem', timeout: 2500 });
        deleteDialog.value = false;
        itemToDelete.value = null;
        await loadZones();
    } catch (err) {
        let errorMessage = 'No se pudo eliminar la sede';
        if (err.response?.status === 409) {
            errorMessage = 'No se puede eliminar esta sede porque tiene ambientes asociados';
        } else if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
        }
        $q.notify({ type: 'negative', message: errorMessage, position: 'top', icon: 'error', timeout: 4000 });
    }
};

onMounted(() => loadZones());
</script>

<style scoped>
:root { --c-border: #e0e0e0; --radius-md: 10px; --radius-lg: 14px; }

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
    border-radius: var(--radius-md); padding: 12px 14px;
    display: flex; align-items: center; gap: 10px;
    border: 2px solid transparent; min-height: 58px;
}
.stat-chip--blue { background: #f0faf0; color: #39A900; border-color: #d4f0b0; }
.stat-number { font-size: 20px; font-weight: 700; line-height: 1; }
.stat-label  { font-size: 11px; font-weight: 500; opacity: .8; }

.table-card {
    border-radius: var(--radius-lg); border: 1px solid var(--c-border);
    overflow: hidden; box-shadow: 0 1px 8px rgba(0,0,0,.06);
}
.zones-table :deep(thead tr th) {
    background: #1a4f00 !important; color: white !important;
    font-weight: 600 !important; font-size: 12px !important;
    text-transform: uppercase !important; letter-spacing: .6px;
    padding: 12px 10px !important; border: none !important;
}
.zones-table :deep(tbody tr) { transition: background .12s; }
.zones-table :deep(tbody tr:hover) { background: #f5fbf0 !important; }
.zones-table :deep(tbody tr td) {
    padding: 10px !important; border-bottom: 1px solid #f0f0f0 !important;
    vertical-align: middle !important;
}

.zone-avatar {
    width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
    background: linear-gradient(135deg, #1a4f00, #39A900);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 6px rgba(57,169,0,.25);
}

.cell-primary   { color: #1e1e1e; font-size: 13px; font-weight: 500; }
.cell-secondary { color: #757575; font-size: 11.5px; margin-top: 1px; }
.text-weight-semibold { font-weight: 600; }
.desc-clamp {
    display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical;
    overflow: hidden; max-width: 300px;
}

@media (max-width: 599px) {
    .page-bg { padding: 10px 8px !important; }
    .stat-number { font-size: 17px; }
    .zones-table :deep(tbody tr td) { padding: 8px 6px !important; }
}
</style>