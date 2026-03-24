<template>
    <q-page class="page-bg q-pa-md q-pa-sm-xs">

        <div class="row items-center q-mb-md q-gutter-sm">
            <div class="row items-center col-12 col-sm-auto">
                <div class="header-icon-wrap q-mr-sm">
                    <q-icon name="badge" size="20px" color="white"/>
                </div>
                <div>
                    <div class="text-h6 text-weight-bold text-dark lh-tight">Gestión de Cuentadantes</div>
                    <div class="text-caption text-grey-6">Responsables de inventario SENA</div>
                </div>
            </div>
            <q-space class="gt-xs"/>
            <q-btn
                outline color="primary"
                icon="refresh" label="Actualizar"
                dense no-caps @click="loadCuentadantes" :loading="loading"
                class="action-btn"
            />
        </div>

        <div v-if="cuentadantes.length > 0" class="row q-col-gutter-sm q-mb-md">
            <div class="col-4">
                <div class="stat-chip stat-chip--blue">
                    <q-icon name="badge" size="18px"/>
                    <div>
                        <div class="stat-number">{{ cuentadantes.length }}</div>
                        <div class="stat-label">Cuentadantes</div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="loading && !cuentadantes.length" class="text-center q-py-xl">
            <q-spinner-dots size="56px" color="primary"/>
            <div class="text-body2 text-grey-6 q-mt-md">Cargando cuentadantes...</div>
        </div>

        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="56px" color="negative" class="q-mb-md"/>
            <div class="text-body1 text-negative">{{ error }}</div>
            <q-btn color="primary" label="Reintentar" @click="loadCuentadantes" class="q-mt-md" unelevated/>
        </div>

        <q-card v-else class="table-card" flat>
            <q-table
                :rows="cuentadantes"
                :columns="columns"
                row-key="_id"
                flat
                :rows-per-page-options="[10, 25, 50, 0]"
                no-data-label="No hay cuentadantes registrados"
                class="cuentadantes-table"
            >
                <template v-slot:top>
                    <div class="row full-width items-center q-px-sm q-py-sm q-gutter-sm">
                        <div class="text-subtitle2 text-weight-bold text-dark col-auto">
                            Listado de cuentadantes
                            <q-badge v-if="cuentadantes.length" color="primary" class="q-ml-xs" :label="cuentadantes.length"/>
                        </div>
                        <q-space/>
                        <q-btn
                            color="primary" icon="add" label="Agregar Cuentadante"
                            unelevated dense no-caps @click="openCreateDialog"
                            style="border-radius:8px;"
                        />
                    </div>
                </template>

                <template v-slot:body-cell-nombre="props">
                    <q-td :props="props">
                        <div class="row no-wrap items-center" style="gap:10px;">
                            <div class="cuentadante-avatar">
                                <q-icon name="badge" size="20px" color="white"/>
                            </div>
                            <div>
                                <div class="text-weight-semibold cell-primary">{{ props.row.nombre }}</div>
                                <div class="cell-secondary">CC {{ props.row.numero_identificacion }}</div>
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
                                <q-tooltip>Editar cuentadante</q-tooltip>
                            </q-btn>
                            <q-btn icon="visibility_off" color="deep-orange" size="sm" round flat dense @click="confirmDelete(props.row)">
                                <q-tooltip>Inhabilitar cuentadante</q-tooltip>
                            </q-btn>
                        </div>
                    </q-td>
                </template>

                <template v-slot:no-data>
                    <div class="full-width text-center q-py-xl">
                        <q-icon name="badge" size="56px" color="grey-4" class="q-mb-md"/>
                        <div class="text-body1 text-grey-6">No hay cuentadantes registrados</div>
                        <div class="text-caption text-grey-5 q-mt-xs">Agrega cuentadantes para poder asignarlos a los ítems del inventario</div>
                    </div>
                </template>
            </q-table>
        </q-card>

        <!-- Dialog crear/editar -->
        <q-dialog v-model="dialog" persistent>
            <q-card style="width: 420px; max-width: 95%;">
                <q-toolbar :class="isEditing ? 'bg-green-9' : 'bg-primary'" class="text-white">
                    <q-icon name="badge" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">
                        {{ isEditing ? 'Editar Cuentadante' : 'Agregar Cuentadante' }}
                    </q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>

                <q-card-section class="q-pt-md">
                    <q-form @submit.prevent="submit" class="q-gutter-md">
                        <q-input
                            v-model="form.nombre"
                            label="Nombre completo del cuentadante *"
                            outlined dense autofocus counter maxlength="150"
                            hint="Ej: Carlos Andrés Morales"
                            :rules="[
                                val => !!val || 'El nombre es obligatorio',
                                val => val.trim().length >= 3 || 'Mínimo 3 caracteres'
                            ]"
                        >
                            <template v-slot:prepend><q-icon name="person"/></template>
                        </q-input>

                        <q-input
                            v-model="form.numero_identificacion"
                            label="Número de identificación (Cédula) *"
                            outlined dense counter maxlength="20"
                            inputmode="numeric"
                            hint="Mínimo 8 dígitos"
                            @update:model-value="v => form.numero_identificacion = String(v).replace(/\D/g, '').slice(0, 20)"
                            @keydown="e => { if (!/^\d$/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'].includes(e.key)) e.preventDefault() }"
                            :rules="[
                                val => !!val || 'El número de identificación es obligatorio',
                                val => /^\d+$/.test(val) || 'Solo dígitos',
                                val => val.length >= 8 || 'Mínimo 8 dígitos'
                            ]"
                        >
                            <template v-slot:prepend><q-icon name="badge"/></template>
                        </q-input>

                        <q-card-actions align="right" class="q-mt-lg q-pb-none">
                            <q-btn flat label="Cancelar" color="grey" v-close-popup/>
                            <q-btn
                                type="submit"
                                :label="isEditing ? 'Guardar Cambios' : 'Agregar'"
                                :color="isEditing ? 'green-9' : 'primary'"
                                :icon="isEditing ? 'save' : 'add'"
                                :loading="submitting"
                            />
                        </q-card-actions>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>

        <!-- Dialog eliminar -->
        <q-dialog v-model="deleteDialog" persistent>
            <q-card style="width: 90vw; max-width: 450px;">
                <q-card-section class="row items-center">
                    <q-avatar icon="visibility_off" color="deep-orange" text-color="white"/>
                    <span class="q-ml-sm text-h6">Inhabilitar Cuentadante</span>
                </q-card-section>
                <q-card-section>
                    <div class="text-body1 q-mb-md">
                        ¿Estás seguro que deseas inhabilitar a
                        <strong>"{{ itemToDelete?.nombre }}"</strong>?
                    </div>
                    <q-banner class="bg-orange-1 text-orange-9" rounded dense>
                        <template v-slot:avatar><q-icon name="info" color="deep-orange"/></template>
                        El cuentadante quedará oculto. No se puede inhabilitar si tiene ítems activos asignados.
                    </q-banner>
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="grey" v-close-popup/>
                    <q-btn flat label="Inhabilitar" color="deep-orange" icon="visibility_off" @click="deleteCuentadante" :loading="submitting"/>
                </q-card-actions>
            </q-card>
        </q-dialog>

    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { cuentadantesService } from '../../services/items.js';

const $q = useQuasar();

const cuentadantes = ref([]);
const loading = ref(false);
const error = ref(null);

const dialog = ref(false);
const deleteDialog = ref(false);
const selectedCuentadante = ref(null);
const itemToDelete = ref(null);
const submitting = ref(false);
const form = ref({ nombre: '', numero_identificacion: '' });

const isEditing = computed(() => !!selectedCuentadante.value);

const columns = [
    { name: 'nombre',   label: 'Nombre / Cédula',  align: 'left',   field: 'nombre',    sortable: true, style: 'min-width: 280px' },
    { name: 'fecha',    label: 'Fecha de alta',     align: 'left',   field: 'createdAt', sortable: true, style: 'min-width: 160px' },
    { name: 'acciones', label: 'Acciones',           align: 'center', field: 'acciones',                  style: 'width: 100px' }
];

const formatDate = (ds) => {
    if (!ds) return 'N/A';
    return new Date(ds).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
};

const loadCuentadantes = async () => {
    loading.value = true;
    error.value = null;
    try {
        cuentadantes.value = await cuentadantesService.getAll();
    } catch (err) {
        error.value = 'Error al cargar los cuentadantes.';
        $q.notify({ type: 'negative', message: 'No se pudieron cargar los cuentadantes', position: 'top', timeout: 3000 });
    } finally {
        loading.value = false;
    }
};

const openCreateDialog = () => {
    selectedCuentadante.value = null;
    form.value = { nombre: '', numero_identificacion: '' };
    dialog.value = true;
};

const openEditDialog = (c) => {
    selectedCuentadante.value = c;
    form.value = { nombre: c.nombre, numero_identificacion: c.numero_identificacion || '' };
    dialog.value = true;
};

const submit = async () => {
    submitting.value = true;
    try {
        const payload = { nombre: form.value.nombre.trim(), numero_identificacion: form.value.numero_identificacion.trim() };
        if (isEditing.value) {
            await cuentadantesService.update(selectedCuentadante.value._id, payload);
            $q.notify({ type: 'info', message: 'Cuentadante actualizado', position: 'top', timeout: 2500 });
        } else {
            await cuentadantesService.create(payload);
            $q.notify({ type: 'positive', message: 'Cuentadante agregado', position: 'top', timeout: 2500 });
        }
        dialog.value = false;
        await loadCuentadantes();
    } catch (err) {
        const msg = err.response?.status === 409
            ? 'Ya existe un cuentadante con ese nombre'
            : err.response?.data?.message || 'No se pudo guardar el cuentadante';
        $q.notify({ type: 'negative', message: msg, position: 'top', timeout: 4000 });
    } finally {
        submitting.value = false;
    }
};

const confirmDelete = (c) => {
    itemToDelete.value = c;
    deleteDialog.value = true;
};

const deleteCuentadante = async () => {
    if (!itemToDelete.value) return;
    submitting.value = true;
    try {
        await cuentadantesService.delete(itemToDelete.value._id);
        $q.notify({ type: 'info', message: 'Cuentadante inhabilitado', position: 'top', timeout: 2500 });
        deleteDialog.value = false;
        itemToDelete.value = null;
        await loadCuentadantes();
    } catch (err) {
        const msg = err.response?.status === 409
            ? err.response.data.message
            : err.response?.data?.message || 'No se pudo eliminar el cuentadante';
        $q.notify({ type: 'negative', message: msg, position: 'top', timeout: 4000 });
    } finally {
        submitting.value = false;
    }
};

onMounted(loadCuentadantes);
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
.cuentadantes-table :deep(thead tr th) {
    background: #1a4f00 !important; color: white !important;
    font-weight: 600 !important; font-size: 12px !important;
    text-transform: uppercase !important; letter-spacing: .6px;
    padding: 12px 10px !important; border: none !important;
}
.cuentadantes-table :deep(tbody tr) { transition: background .12s; }
.cuentadantes-table :deep(tbody tr:hover) { background: #f5fbf0 !important; }
.cuentadantes-table :deep(tbody tr td) {
    padding: 10px !important; border-bottom: 1px solid #f0f0f0 !important;
    vertical-align: middle !important;
}

.cuentadante-avatar {
    width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
    background: linear-gradient(135deg, #1a4f00, #39A900);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 6px rgba(57,169,0,.25);
}

.cell-primary   { color: #1e1e1e; font-size: 13px; font-weight: 500; }
.cell-secondary { color: #757575; font-size: 11.5px; margin-top: 1px; }
.text-weight-semibold { font-weight: 600; }

@media (max-width: 599px) {
    .page-bg { padding: 10px 8px !important; }
    .stat-number { font-size: 17px; }
    .cuentadantes-table :deep(tbody tr td) { padding: 8px 6px !important; }
}
</style>