<template>
    <q-page class="page-bg q-pa-md q-pa-sm-xs">

        <div class="row items-center q-mb-md q-gutter-sm">
            <div class="row items-center col-12 col-sm-auto">
                <q-btn icon="arrow_back" flat round dense color="primary"
                    @click="router.push({ name: 'admin.zones' })" class="q-mr-xs">
                    <q-tooltip>Volver a Sedes</q-tooltip>
                </q-btn>
                <div class="header-icon-wrap q-mr-sm">
                    <q-icon name="meeting_room" size="20px" color="white"/>
                </div>
                <div>
                    <div class="text-h6 text-weight-bold text-dark lh-tight">Gestión de Ambientes</div>
                    <div class="text-caption text-grey-6">Administra los ambientes por sede</div>
                </div>
            </div>
            <q-space class="gt-xs"/>
            <q-btn
                outline color="primary"
                icon="refresh" label="Actualizar"
                dense no-caps @click="loadClassrooms" :loading="loading"
                class="action-btn"
            />
        </div>

        <div v-if="classrooms.length > 0" class="row q-col-gutter-sm q-mb-md">
            <div class="col-4">
                <div class="stat-chip stat-chip--blue">
                    <q-icon name="meeting_room" size="18px"/>
                    <div>
                        <div class="stat-number">{{ classrooms.length }}</div>
                        <div class="stat-label">Ambientes</div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="loading && !classrooms.length" class="text-center q-py-xl">
            <q-spinner-dots size="56px" color="primary"/>
            <div class="text-body2 text-grey-6 q-mt-md">Cargando ambientes...</div>
        </div>

        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="56px" color="negative" class="q-mb-md"/>
            <div class="text-body1 text-negative">{{ error }}</div>
            <q-btn color="primary" label="Reintentar" @click="loadClassrooms" class="q-mt-md" unelevated/>
        </div>

        <q-card v-else class="table-card" flat>
            <q-table
                :rows="classrooms"
                :columns="classroomColumns"
                row-key="_id"
                flat
                :rows-per-page-options="[10, 25, 50, 0]"
                no-data-label="No hay ambientes registrados"
                class="classrooms-table"
            >
                <template v-slot:top>
                    <div class="row full-width items-center q-px-sm q-py-sm q-gutter-sm">
                        <div class="text-subtitle2 text-weight-bold text-dark col-auto">
                            Listado de ambientes
                            <q-badge v-if="classrooms.length" color="primary" class="q-ml-xs" :label="classrooms.length"/>
                        </div>
                        <q-space/>
                        <q-btn
                            color="primary" icon="add" label="Crear Ambiente"
                            unelevated dense no-caps @click="openCreateDialog"
                            style="border-radius:8px;"
                        />
                    </div>
                </template>

                <template v-slot:body-cell-nombre="props">
                    <q-td :props="props">
                        <div class="row no-wrap items-center" style="gap:10px;">
                            <div class="classroom-avatar">
                                <q-icon name="meeting_room" size="20px" color="white"/>
                            </div>
                            <div>
                                <div class="text-weight-semibold cell-primary">{{ props.row.nombre }}</div>
                                <div v-if="props.row.descripcion" class="cell-secondary desc-clamp">{{ props.row.descripcion }}</div>
                            </div>
                        </div>
                    </q-td>
                </template>

                <template v-slot:body-cell-zona="props">
                    <q-td :props="props">
                        <div class="row items-center" style="gap:6px;">
                            <q-icon name="category" size="13px" color="primary"/>
                            <span class="cell-primary">{{ props.row.zona?.nombre || '—' }}</span>
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
                            <q-btn icon="remove_red_eye" color="teal" size="sm" round flat dense @click="openItemsDialog(props.row)">
                                <q-tooltip>Ver ítems del ambiente</q-tooltip>
                            </q-btn>
                            <q-btn icon="edit" color="primary" size="sm" round flat dense @click="openEditDialog(props.row)">
                                <q-tooltip>Editar ambiente</q-tooltip>
                            </q-btn>
                            <q-btn icon="visibility_off" color="deep-orange" size="sm" round flat dense @click="confirmDelete(props.row)">
                                <q-tooltip>Inhabilitar ambiente</q-tooltip>
                            </q-btn>
                        </div>
                    </q-td>
                </template>

                <template v-slot:no-data>
                    <div class="full-width text-center q-py-xl">
                        <q-icon name="meeting_room" size="56px" color="grey-4" class="q-mb-md"/>
                        <div class="text-body1 text-grey-6">No hay ambientes registrados</div>
                        <div class="text-caption text-grey-5 q-mt-xs">Crea tu primer ambiente para comenzar a organizar el inventario</div>
                    </div>
                </template>
            </q-table>
        </q-card>

        <q-dialog v-model="classroomDialog" persistent>
            <q-card style="width: 450px; max-width: 95%;">
                <q-toolbar :class="isEditing ? 'bg-green-9' : 'bg-primary'" class="text-white">
                    <q-icon name="meeting_room" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">
                        {{ isEditing ? 'Editar Ambiente' : 'Crear Nuevo Ambiente' }}
                    </q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>

                <q-card-section class="q-pt-md">
                    <q-form @submit.prevent="submitClassroom" class="q-gutter-md">
                        <q-select
                            v-model="classroomForm.zona"
                            :options="zonaOptions"
                            option-value="_id" option-label="nombre"
                            emit-value map-options
                            label="Sede a la que pertenece"
                            outlined dense
                            :rules="[val => !!val || 'La sede es obligatoria']"
                        >
                            <template v-slot:prepend><q-icon name="category"/></template>
                        </q-select>

                        <q-input
                            v-model="classroomForm.nombre"
                            label="Nombre del Ambiente"
                            outlined dense autofocus counter maxlength="150"
                            hint="Ej: Ambiente 101, Laboratorio A, Sala de Conferencias"
                            :rules="[
                                val => !!val || 'El nombre es obligatorio',
                                val => val.length >= 3 || 'Mínimo 3 caracteres'
                            ]"
                        >
                            <template v-slot:prepend><q-icon name="label"/></template>
                        </q-input>

                        <q-input
                            v-model="classroomForm.descripcion"
                            label="Descripción"
                            type="textarea" rows="3"
                            outlined dense counter maxlength="500"
                            hint="Describe la ubicación o características del ambiente"
                        >
                            <template v-slot:prepend><q-icon name="description"/></template>
                        </q-input>

                        <q-card-actions align="right" class="q-mt-lg q-pb-none">
                            <q-btn flat label="Cancelar" color="grey" v-close-popup/>
                            <q-btn
                                type="submit"
                                :label="isEditing ? 'Guardar Cambios' : 'Crear Ambiente'"
                                :color="isEditing ? 'green-9' : 'primary'"
                                :icon="isEditing ? 'save' : 'add'"
                                :loading="submitting"
                            />
                        </q-card-actions>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>

        <!-- Diálogo de inhabilitar ambiente mejorado -->
        <q-dialog v-model="deleteDialog" persistent>
            <q-card style="width: 90vw; max-width: 500px;">
                <q-toolbar class="bg-deep-orange text-white">
                    <q-icon name="visibility_off" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">Inhabilitar Ambiente</q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup :disable="deleting"/>
                </q-toolbar>

                <q-card-section v-if="loadingDeleteCheck" class="text-center q-py-lg">
                    <q-spinner-dots size="40px" color="deep-orange"/>
                    <div class="text-caption text-grey-6 q-mt-sm">Verificando ítems activos...</div>
                </q-card-section>

                <q-card-section v-else class="q-pt-md">
                    <!-- Bloqueado: tiene ítems activos -->
                    <template v-if="deleteCheckInfo.itemsActivos > 0">
                        <q-banner class="bg-red-1 text-red-9 q-mb-md" rounded>
                            <template v-slot:avatar><q-icon name="block" color="red-8" size="28px"/></template>
                            <div class="text-weight-bold q-mb-xs">No se puede inhabilitar aún</div>
                            <div class="text-body2">
                                El ambiente <strong>"{{ itemToDelete?.nombre }}"</strong> tiene
                                <strong>{{ deleteCheckInfo.itemsActivos }} ítem(es) activo(s)</strong>.
                                Primero debes inhabilitar todos sus ítems.
                            </div>
                        </q-banner>

                        <div class="text-subtitle2 text-grey-7 q-mb-xs">Ítems activos que debes inhabilitar:</div>
                        <q-list dense bordered separator class="rounded-borders q-mb-md">
                            <q-item v-for="item in deleteCheckInfo.items" :key="item._id" dense class="q-py-sm">
                                <q-item-section avatar>
                                    <q-icon name="inventory_2" color="deep-orange" size="18px"/>
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label class="text-weight-medium">{{ item.nombre }}</q-item-label>
                                    <q-item-label caption class="text-grey-7">
                                        Tipo: {{ item.tipo_categoria || '—' }} | Stock: {{ item.cantidad_disponible }}/{{ item.cantidad_total_stock }}
                                    </q-item-label>
                                </q-item-section>
                                <q-item-section side>
                                    <q-badge
                                        color="red-2"
                                        text-color="red-9"
                                        :label="`${item.cantidad_total_stock} unidades`"
                                    />
                                </q-item-section>
                            </q-item>
                        </q-list>

                        <q-banner class="bg-blue-1 text-blue-9" rounded dense>
                            <template v-slot:avatar><q-icon name="lightbulb" color="blue-7"/></template>
                            <span class="text-caption">
                                Ve a <strong>Gestión de Ítems</strong>, inhabilita primero todos los ítems de este ambiente,
                                y luego vuelve aquí para inhabilitar el ambiente.
                            </span>
                        </q-banner>
                    </template>

                    <!-- OK: puede inhabilitarse -->
                    <template v-else>
                        <div class="text-body1 q-mb-md">
                            ¿Deseas inhabilitar el ambiente <strong>"{{ itemToDelete?.nombre }}"</strong>?
                        </div>
                        <q-banner class="bg-green-1 text-green-9 q-mb-sm" rounded dense>
                            <template v-slot:avatar><q-icon name="check_circle" color="green-7"/></template>
                            <span class="text-caption">Este ambiente no tiene ítems activos y puede inhabilitarse sin problemas.</span>
                        </q-banner>
                        <q-banner class="bg-orange-1 text-orange-9" rounded dense>
                            <template v-slot:avatar><q-icon name="info" color="deep-orange"/></template>
                            <span class="text-caption">El SuperAdmin puede reactivarlo desde el <strong>Archivo</strong>.</span>
                        </q-banner>
                    </template>
                </q-card-section>

                <q-card-actions align="right" class="q-px-md q-pb-md">
                    <q-btn flat label="Cerrar" color="grey" v-close-popup :disable="deleting"/>
                    <q-btn
                        v-if="!loadingDeleteCheck && deleteCheckInfo.itemsActivos === 0"
                        unelevated label="Inhabilitar"
                        color="deep-orange" icon="visibility_off"
                        :loading="deleting"
                        @click="deleteClassroom"
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <q-dialog v-model="itemsDialog" style="max-width:900px;width:95vw;">
            <q-card style="width:100%;max-width:860px;">
                <q-toolbar class="bg-teal text-white">
                    <q-icon name="inventory_2" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">
                        Ítems en "{{ selectedClassroomView?.nombre }}"
                    </q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>

                <q-card-section v-if="loadingItems" class="text-center q-py-xl">
                    <q-spinner-dots size="48px" color="teal"/>
                    <div class="text-body2 text-grey-6 q-mt-md">Cargando ítems...</div>
                </q-card-section>

                <q-card-section v-else-if="aulaItems.length === 0" class="text-center q-py-xl">
                    <q-icon name="inventory_2" size="56px" color="grey-4" class="q-mb-md"/>
                    <div class="text-body1 text-grey-6">Este ambiente no tiene ítems asignados</div>
                </q-card-section>

                <q-card-section v-else class="q-pa-sm">
                    <div class="text-caption text-grey-6 q-mb-sm q-px-sm">
                        {{ aulaItems.length }} ítem(s) encontrado(s)
                    </div>
                    <q-table
                        :rows="aulaItems"
                        :columns="itemColumns"
                        row-key="_id"
                        flat dense
                        :rows-per-page-options="[10, 25, 0]"
                    >
                        <template v-slot:body-cell-nombre="props">
                            <q-td :props="props">
                                <div class="text-weight-medium">{{ props.row.nombre }}</div>
                                <div class="text-caption text-grey-6">{{ props.row.descripcion || '—' }}</div>
                            </q-td>
                        </template>
                        <template v-slot:body-cell-tipo="props">
                            <q-td :props="props">
                                <q-badge
                                    :color="props.row.tipo_categoria === 'Consumible' ? 'orange-7' : props.row.tipo_categoria === 'De Uso Controlado' ? 'purple-7' : 'blue-7'"
                                    :label="props.row.tipo_categoria"
                                    style="font-size:10px;"
                                />
                            </q-td>
                        </template>
                        <template v-slot:body-cell-stock="props">
                            <q-td :props="props" class="text-center">
                                <span class="text-weight-bold">{{ props.row.cantidad_disponible }}</span>
                                <span class="text-grey-5"> / {{ props.row.cantidad_total_stock }}</span>
                            </q-td>
                        </template>
                        <template v-slot:body-cell-estado="props">
                            <q-td :props="props" class="text-center">
                                <q-badge
                                    :color="props.row.estado === 'Disponible' ? 'positive' : 'negative'"
                                    :label="props.row.estado"
                                    style="font-size:10px;"
                                />
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
import { useRouter } from 'vue-router';
import { classroomsService, zonesService, itemsService } from '../../services/items.js';

const $q = useQuasar();
const router = useRouter();

const classrooms = ref([]);
const zones = ref([]);
const loading = ref(false);
const error = ref(null);

const classroomDialog = ref(false);
const selectedClassroom = ref(null);
const submitting = ref(false);
const classroomForm = ref({ nombre: '', descripcion: '', zona: null });

const deleteDialog = ref(false);
const itemToDelete = ref(null);
const loadingDeleteCheck = ref(false);
const deleting = ref(false);
const deleteCheckInfo = ref({ itemsActivos: 0, items: [] });

// ── Dialog: ver ítems del ambiente ───────────────────────────────────────────
const itemsDialog = ref(false);
const selectedClassroomView = ref(null);
const aulaItems = ref([]);
const loadingItems = ref(false);

const itemColumns = [
    { name: 'nombre', label: 'Ítem',       align: 'left',   field: 'nombre',              sortable: true, style: 'min-width:200px' },
    { name: 'tipo',   label: 'Tipo',       align: 'left',   field: 'tipo_categoria',      sortable: true, style: 'min-width:140px' },
    { name: 'stock',  label: 'Disp./Total',align: 'center', field: 'cantidad_disponible', sortable: true, style: 'width:110px' },
    { name: 'estado', label: 'Estado',     align: 'center', field: 'estado',              sortable: true, style: 'width:100px' },
];

const openItemsDialog = async (classroom) => {
    selectedClassroomView.value = classroom;
    aulaItems.value = [];
    itemsDialog.value = true;
    loadingItems.value = true;
    try {
        aulaItems.value = await itemsService.getAll({ aula: classroom._id });
    } catch (err) {
        $q.notify({ type: 'negative', message: 'No se pudieron cargar los ítems', position: 'top', timeout: 3000 });
    } finally {
        loadingItems.value = false;
    }
};

const zonaOptions = computed(() => zones.value);
const isEditing = computed(() => !!selectedClassroom.value);

const classroomColumns = [
    { name: 'nombre',   label: 'Ambiente',       align: 'left',   field: 'nombre',    sortable: true, style: 'min-width: 220px' },
    { name: 'zona',     label: 'Sede',            align: 'left',   field: row => row.zona?.nombre, sortable: true, style: 'min-width: 160px' },
    { name: 'fecha',    label: 'Fecha creación',  align: 'left',   field: 'createdAt', sortable: true, style: 'min-width: 160px' },
    { name: 'acciones', label: 'Acciones',         align: 'center', field: 'acciones',                 style: 'width: 100px' }
];

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
};

const loadZones = async () => {
    try { zones.value = await zonesService.getAll(); } catch (err) { console.error(err); }
};

const loadClassrooms = async () => {
    loading.value = true;
    error.value = null;
    try {
        classrooms.value = await classroomsService.getAll();
    } catch (err) {
        console.error('Error cargando ambientes:', err);
        error.value = 'Error al cargar los ambientes. Por favor, intenta nuevamente.';
        $q.notify({ type: 'negative', message: 'No se pudieron cargar los ambientes', position: 'top', icon: 'error', timeout: 3000 });
    } finally {
        loading.value = false;
    }
};

const openCreateDialog = () => {
    selectedClassroom.value = null;
    classroomForm.value = { nombre: '', descripcion: '', zona: null };
    classroomDialog.value = true;
};

const openEditDialog = (classroom) => {
    selectedClassroom.value = classroom;
    classroomForm.value = {
        nombre: classroom.nombre,
        descripcion: classroom.descripcion || '',
        zona: classroom.zona?._id || classroom.zona || null
    };
    classroomDialog.value = true;
};

const submitClassroom = async () => {
    submitting.value = true;
    try {
        if (isEditing.value) {
            await classroomsService.update(selectedClassroom.value._id, classroomForm.value);
            $q.notify({ type: 'info', message: 'Ambiente actualizado exitosamente', position: 'top', icon: 'upload', timeout: 2500 });
        } else {
            await classroomsService.create(classroomForm.value);
            $q.notify({ type: 'positive', message: 'Ambiente creado exitosamente', position: 'top', icon: 'check_circle', timeout: 2500 });
        }
        classroomDialog.value = false;
        await loadClassrooms();
    } catch (err) {
        const errorMessage = err.response?.data?.message || 'No se pudo guardar el ambiente';
        $q.notify({ type: 'negative', message: errorMessage, position: 'top', icon: 'error', timeout: 5000 });
    } finally {
        submitting.value = false;
    }
};

const confirmDelete = async (item) => {
    itemToDelete.value = item;
    deleteCheckInfo.value = { itemsActivos: 0, items: [] };
    deleteDialog.value = true;
    loadingDeleteCheck.value = true;
    try {
        // Cargar todos los ítems de este ambiente
        const itemsActivos = await itemsService.getAll({ aula: item._id });
        deleteCheckInfo.value = {
            itemsActivos: itemsActivos.length,
            items: itemsActivos,
        };
    } catch (err) {
        $q.notify({ type: 'negative', message: 'Error al verificar ítems activos', position: 'top', timeout: 3000 });
        deleteDialog.value = false;
    } finally {
        loadingDeleteCheck.value = false;
    }
};

const deleteClassroom = async () => {
    if (!itemToDelete.value) return;
    deleting.value = true;
    try {
        await classroomsService.delete(itemToDelete.value._id);
        $q.notify({ type: 'info', message: 'Ambiente inhabilitado exitosamente', position: 'top', icon: 'visibility_off', timeout: 2500 });
        deleteDialog.value = false;
        itemToDelete.value = null;
        await loadClassrooms();
    } catch (err) {
        let errorMessage = 'No se pudo inhabilitar el ambiente';
        if (err.response?.status === 409) {
            errorMessage = 'No se puede inhabilitar este ambiente porque tiene ítems asociados';
        } else if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
        }
        $q.notify({ type: 'negative', message: errorMessage, position: 'top', icon: 'error', timeout: 4000 });
    } finally {
        deleting.value = false;
    }
};

onMounted(async () => {
    await loadZones();
    await loadClassrooms();
});
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
.classrooms-table :deep(thead tr th) {
    background: #1a4f00 !important; color: white !important;
    font-weight: 600 !important; font-size: 12px !important;
    text-transform: uppercase !important; letter-spacing: .6px;
    padding: 12px 10px !important; border: none !important;
}
.classrooms-table :deep(tbody tr) { transition: background .12s; }
.classrooms-table :deep(tbody tr:hover) { background: #f5fbf0 !important; }
.classrooms-table :deep(tbody tr td) {
    padding: 10px !important; border-bottom: 1px solid #f0f0f0 !important;
    vertical-align: middle !important;
}

.classroom-avatar {
    width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
    background: linear-gradient(135deg, #2d8600, #2d8600);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 6px rgba(14,116,144,.25);
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
    .classrooms-table :deep(tbody tr td) { padding: 8px 6px !important; }
}
</style>