<template>
    <q-page class="page-bg q-pa-md q-pa-sm-xs">

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

        <div v-if="loading && !zones.length" class="text-center q-py-xl">
            <q-spinner-dots size="56px" color="primary"/>
            <div class="text-body2 text-grey-6 q-mt-md">Cargando sedes...</div>
        </div>

        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="56px" color="negative" class="q-mb-md"/>
            <div class="text-body1 text-negative">{{ error }}</div>
            <q-btn color="primary" label="Reintentar" @click="loadZones" class="q-mt-md" unelevated/>
        </div>

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
                            <q-btn icon="remove_red_eye" color="teal" size="sm" round flat dense @click="openAulasDialog(props.row)">
                                <q-tooltip>Ver ambientes de la sede</q-tooltip>
                            </q-btn>
                            <q-btn icon="edit" color="primary" size="sm" round flat dense @click="openEditDialog(props.row)">
                                <q-tooltip>Editar sede</q-tooltip>
                            </q-btn>
                            <q-btn icon="visibility_off" color="deep-orange" size="sm" round flat dense @click="confirmDelete(props.row)">
                                <q-tooltip>Inhabilitar sede</q-tooltip>
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

        <q-dialog v-model="deleteDialog" persistent>
            <q-card style="width: 90vw; max-width: 500px;">
                <q-toolbar class="bg-deep-orange text-white">
                    <q-icon name="visibility_off" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">Inhabilitar Sede</q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup :disable="deleting"/>
                </q-toolbar>

                <q-card-section v-if="loadingDeleteCheck" class="text-center q-py-lg">
                    <q-spinner-dots size="40px" color="deep-orange"/>
                    <div class="text-caption text-grey-6 q-mt-sm">Verificando dependencias...</div>
                </q-card-section>

                <q-card-section v-else class="q-pt-md">
                    <!-- Bloqueado: tiene ambientes activos -->
                    <template v-if="deleteCheckInfo.ambientesActivos > 0">
                        <q-banner class="bg-red-1 text-red-9 q-mb-md" rounded>
                            <template v-slot:avatar><q-icon name="block" color="red-8" size="28px"/></template>
                            <div class="text-weight-bold q-mb-xs">No se puede inhabilitar aún</div>
                            <div class="text-body2">
                                La sede <strong>"{{ itemToDelete?.nombre }}"</strong> tiene
                                <strong>{{ deleteCheckInfo.ambientesActivos }} ambiente(s) activo(s)</strong>.
                                Primero debes inhabilitar todos sus ambientes.
                            </div>
                        </q-banner>

                        <div class="text-subtitle2 text-grey-7 q-mb-xs">Ambientes activos que debes inhabilitar:</div>
                        <q-list dense bordered separator class="rounded-borders q-mb-md">
                            <q-item v-for="amb in deleteCheckInfo.ambientes" :key="amb._id" dense class="q-py-sm">
                                <q-item-section avatar>
                                    <q-icon name="meeting_room" color="deep-orange" size="18px"/>
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label class="text-weight-medium">{{ amb.nombre }}</q-item-label>
                                    <q-item-label caption :class="amb.itemsCount > 0 ? 'text-negative' : 'text-positive'">
                                        {{ amb.itemsCount > 0 ? `${amb.itemsCount} ítem(s) activo(s) — inhabilítalos primero` : 'Sin ítems activos — listo para inhabilitar' }}
                                    </q-item-label>
                                </q-item-section>
                                <q-item-section side>
                                    <q-badge
                                        :color="amb.itemsCount > 0 ? 'red-2' : 'green-2'"
                                        :text-color="amb.itemsCount > 0 ? 'red-9' : 'green-9'"
                                        :label="amb.itemsCount > 0 ? `${amb.itemsCount} ítems` : 'Vacío'"
                                    />
                                </q-item-section>
                            </q-item>
                        </q-list>

                        <q-banner class="bg-blue-1 text-blue-9" rounded dense>
                            <template v-slot:avatar><q-icon name="lightbulb" color="blue-7"/></template>
                            <span class="text-caption">
                                Ve a <strong>Gestión de Ambientes</strong>, inhabilita primero los ítems de cada ambiente,
                                luego inhabilita el ambiente, y finalmente vuelve aquí para inhabilitar la sede.
                            </span>
                        </q-banner>
                    </template>

                    <!-- OK: puede inhabilitarse -->
                    <template v-else>
                        <div class="text-body1 q-mb-md">
                            ¿Deseas inhabilitar la sede <strong>"{{ itemToDelete?.nombre }}"</strong>?
                        </div>
                        <q-banner class="bg-green-1 text-green-9 q-mb-sm" rounded dense>
                            <template v-slot:avatar><q-icon name="check_circle" color="green-7"/></template>
                            <span class="text-caption">Esta sede no tiene ambientes activos y puede inhabilitarse sin problemas.</span>
                        </q-banner>
                        <q-banner class="bg-orange-1 text-orange-9" rounded dense>
                            <template v-slot:avatar><q-icon name="info" color="deep-orange"/></template>
                            <span class="text-caption">El SuperAdmin puede reactivarla desde el <strong>Archivo</strong>.</span>
                        </q-banner>
                    </template>
                </q-card-section>

                <q-card-actions align="right" class="q-px-md q-pb-md">
                    <q-btn flat label="Cerrar" color="grey" v-close-popup :disable="deleting"/>
                    <q-btn
                        v-if="!loadingDeleteCheck && deleteCheckInfo.ambientesActivos === 0"
                        unelevated label="Inhabilitar"
                        color="deep-orange" icon="visibility_off"
                        :loading="deleting"
                        @click="deleteZone(itemToDelete)"
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <q-dialog v-model="aulasDialog" style="max-width:800px;width:95vw;">
            <q-card style="width:100%;max-width:760px;">
                <q-toolbar class="bg-teal text-white">
                    <q-icon name="meeting_room" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">
                        Ambientes en "{{ selectedZoneView?.nombre }}"
                    </q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>

                <q-card-section v-if="loadingAulas" class="text-center q-py-xl">
                    <q-spinner-dots size="48px" color="teal"/>
                    <div class="text-body2 text-grey-6 q-mt-md">Cargando ambientes...</div>
                </q-card-section>

                <q-card-section v-else-if="zonaAulas.length === 0" class="text-center q-py-xl">
                    <q-icon name="meeting_room" size="56px" color="grey-4" class="q-mb-md"/>
                    <div class="text-body1 text-grey-6">Esta sede no tiene ambientes registrados</div>
                </q-card-section>

                <q-card-section v-else class="q-pa-sm">
                    <div class="text-caption text-grey-6 q-mb-sm q-px-sm">
                        {{ zonaAulas.length }} ambiente(s) encontrado(s)
                    </div>
                    <q-table
                        :rows="zonaAulas"
                        :columns="aulaColumns"
                        row-key="_id"
                        flat dense
                        :rows-per-page-options="[10, 25, 0]"
                    >
                        <template v-slot:body-cell-nombre="props">
                            <q-td :props="props">
                                <div class="row items-center no-wrap" style="gap:8px;">
                                    <q-icon name="meeting_room" color="teal" size="18px"/>
                                    <div>
                                        <div class="text-weight-medium">{{ props.row.nombre }}</div>
                                        <div v-if="props.row.descripcion" class="text-caption text-grey-6">{{ props.row.descripcion }}</div>
                                    </div>
                                </div>
                            </q-td>
                        </template>
                        <template v-slot:body-cell-fecha="props">
                            <q-td :props="props">
                                <span class="text-caption text-grey-6">{{ formatDate(props.row.createdAt) }}</span>
                            </q-td>
                        </template>
                    </q-table>
                </q-card-section>
            </q-card>
        </q-dialog>

    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { zonesService, classroomsService, itemsService } from '../../services/items.js';

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
const loadingDeleteCheck = ref(false);
const deleting = ref(false);
const deleteCheckInfo = ref({ ambientesActivos: 0, ambientes: [] });

// ── Dialog: ver ambientes de la sede ─────────────────────────────────────────
const aulasDialog = ref(false);
const selectedZoneView = ref(null);
const zonaAulas = ref([]);
const loadingAulas = ref(false);

const aulaColumns = [
    { name: 'nombre', label: 'Ambiente',      align: 'left', field: 'nombre',    sortable: true, style: 'min-width:220px' },
    { name: 'fecha',  label: 'Fecha creación', align: 'left', field: 'createdAt', sortable: true, style: 'min-width:160px' },
];

const openAulasDialog = async (zone) => {
    selectedZoneView.value = zone;
    zonaAulas.value = [];
    aulasDialog.value = true;
    loadingAulas.value = true;
    try {
        zonaAulas.value = await classroomsService.getAll({ zona: zone._id });
    } catch (err) {
        $q.notify({ type: 'negative', message: 'No se pudieron cargar los ambientes', position: 'top', timeout: 3000 });
    } finally {
        loadingAulas.value = false;
    }
};

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

const confirmDelete = async (item) => {
    itemToDelete.value = item;
    deleteCheckInfo.value = { ambientesActivos: 0, ambientes: [] };
    deleteDialog.value = true;
    loadingDeleteCheck.value = true;
    try {
        // Cargar ambientes activos de esta sede con conteo de ítems
        const [ambientesActivos, todosItems] = await Promise.all([
            classroomsService.getAll({ zona: item._id }),
            itemsService.getAll({ zona: item._id }),
        ]);
        const countMap = new Map();
        todosItems.forEach(i => {
            const aulaId = String(i.aula?._id || i.aula);
            countMap.set(aulaId, (countMap.get(aulaId) || 0) + 1);
        });
        const ambientesConConteo = ambientesActivos.map(a => ({
            ...a,
            itemsCount: countMap.get(String(a._id)) || 0,
        }));
        deleteCheckInfo.value = {
            ambientesActivos: ambientesActivos.length,
            ambientes: ambientesConConteo,
        };
    } catch (err) {
        $q.notify({ type: 'negative', message: 'Error al verificar dependencias', position: 'top', timeout: 3000 });
        deleteDialog.value = false;
    } finally {
        loadingDeleteCheck.value = false;
    }
};

const deleteZone = async (zone) => {
    if (!itemToDelete.value) return;
    deleting.value = true;
    try {
        await zonesService.delete((zone || itemToDelete.value)._id);
        $q.notify({ type: 'info', message: 'Sede inhabilitada exitosamente', position: 'top', icon: 'visibility_off', timeout: 2500 });
        deleteDialog.value = false;
        itemToDelete.value = null;
        await loadZones();
    } catch (err) {
        const msg = err.response?.data?.message || 'No se pudo inhabilitar la sede';
        $q.notify({ type: 'negative', message: msg, position: 'top', icon: 'error', timeout: 4000 });
    } finally {
        deleting.value = false;
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