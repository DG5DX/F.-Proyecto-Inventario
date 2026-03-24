<template>
    <q-page class="page-bg q-pa-md q-pa-sm-xs">

        <div class="row items-center q-mb-md q-gutter-sm">
            <div class="row items-center col-12 col-sm-auto">
                <div class="header-icon-wrap q-mr-sm">
                    <q-icon name="inventory" size="20px" color="white"/>
                </div>
                <div>
                    <div class="text-h6 text-weight-bold text-dark lh-tight">Archivo — Elementos Inhabilitados</div>
                    <div class="text-caption text-grey-6">Sedes, ambientes, ítems y cuentadantes ocultos. Solo visible para SuperAdmin.</div>
                </div>
            </div>
            <q-space class="gt-xs"/>
            <q-btn outline color="primary" icon="refresh" label="Actualizar" dense no-caps
                @click="loadAll" :loading="loading" class="action-btn"/>
        </div>

        <!-- Guía del flujo de reactivación -->
        <q-banner class="bg-blue-1 text-blue-9 q-mb-md" rounded dense>
            <template v-slot:avatar><q-icon name="info" color="blue-7"/></template>
            <span class="text-caption">
                Para reactivar correctamente sigue el orden:
                <strong>1. Sede → 2. Ambiente → 3. Ítems</strong>.
                El sistema te avisará si falta reactivar un nivel superior.
            </span>
        </q-banner>

        <!-- Tabs de categoría -->
        <q-tabs v-model="tab" dense align="left" active-color="deep-orange"
            indicator-color="deep-orange" class="bg-white rounded-top q-mb-xs shadow-1">
            <q-tab name="zonas"        icon="category"               label="Sedes"        :badge="counts.zonas        || undefined"/>
            <q-tab name="ambientes"    icon="meeting_room"           label="Ambientes"    :badge="counts.ambientes    || undefined"/>
            <q-tab name="items"        icon="inventory_2"            label="Materiales"   :badge="counts.items        || undefined"/>
            <q-tab name="equipos"      icon="precision_manufacturing" label="Equipos"     :badge="counts.equipos      || undefined"/>
            <q-tab name="cuentadantes" icon="badge"                  label="Cuentadantes" :badge="counts.cuentadantes || undefined"/>
        </q-tabs>

        <div v-if="loading" class="text-center q-py-xl">
            <q-spinner-dots size="56px" color="deep-orange"/>
            <div class="text-body2 text-grey-6 q-mt-md">Cargando archivo...</div>
        </div>

        <template v-else>
            <q-tab-panels v-model="tab" animated>

                <!-- ── SEDES ──────────────────────────────────────────────────── -->
                <q-tab-panel name="zonas" class="q-pa-none">
                    <q-card flat class="table-card">
                        <q-table :rows="inactiveZonas" :columns="colZonas" row-key="_id" flat
                            no-data-label="No hay sedes inhabilitadas"
                            :rows-per-page-options="[10,25,0]" class="archive-table">
                            <template v-slot:body-cell-nombre="props">
                                <q-td :props="props">
                                    <div class="text-weight-medium text-grey-7">{{ props.row.nombre }}</div>
                                    <div v-if="props.row.descripcion" class="text-caption text-grey-5">{{ props.row.descripcion }}</div>
                                    <!-- Indicador de cuántos ambientes inhabilitados tiene -->
                                    <div v-if="contarAmbientesInactivos(props.row._id) > 0" class="q-mt-xs">
                                        <q-badge color="orange-2" text-color="orange-9" style="font-size:9px;">
                                            {{ contarAmbientesInactivos(props.row._id) }} ambiente(s) inhabilitado(s)
                                        </q-badge>
                                    </div>
                                </q-td>
                            </template>
                            <template v-slot:body-cell-fecha="props">
                                <q-td :props="props" class="text-caption text-grey-6">{{ formatDate(props.row.updatedAt) }}</q-td>
                            </template>
                            <template v-slot:body-cell-acciones="props">
                                <q-td :props="props" class="text-center">
                                    <q-btn icon="visibility" color="positive" size="sm" round flat dense
                                        @click="reactivar('zona', props.row)">
                                        <q-tooltip>Reactivar sede</q-tooltip>
                                    </q-btn>
                                </q-td>
                            </template>
                        </q-table>
                    </q-card>
                </q-tab-panel>

                <!-- ── AMBIENTES ───────────────────────────────────────────── -->
                <q-tab-panel name="ambientes" class="q-pa-none">
                    <q-card flat class="table-card">
                        <q-table :rows="inactiveAmbientes" :columns="colAmbientes" row-key="_id" flat
                            no-data-label="No hay ambientes inhabilitados"
                            :rows-per-page-options="[10,25,0]" class="archive-table">
                            <template v-slot:body-cell-nombre="props">
                                <q-td :props="props">
                                    <div class="text-weight-medium text-grey-7">{{ props.row.nombre }}</div>
                                    <div class="text-caption text-grey-5 row items-center" style="gap:4px;">
                                        <q-icon name="category" size="11px"/>
                                        {{ props.row.zona?.nombre || '—' }}
                                    </div>
                                    <!-- Estado de la sede padre -->
                                    <div class="q-mt-xs">
                                        <q-badge v-if="props.row.zona && !props.row.zona.activo"
                                            color="red-2" text-color="red-9" style="font-size:9px;">
                                            <q-icon name="warning" size="10px" class="q-mr-xs"/>
                                            Sede inhabilitada — reactívala primero
                                        </q-badge>
                                        <q-badge v-else color="green-2" text-color="green-9" style="font-size:9px;">
                                            <q-icon name="check" size="10px" class="q-mr-xs"/>
                                            Sede activa — listo para reactivar
                                        </q-badge>
                                    </div>
                                </q-td>
                            </template>
                            <template v-slot:body-cell-fecha="props">
                                <q-td :props="props" class="text-caption text-grey-6">{{ formatDate(props.row.updatedAt) }}</q-td>
                            </template>
                            <template v-slot:body-cell-acciones="props">
                                <q-td :props="props" class="text-center">
                                    <q-btn icon="visibility" color="positive" size="sm" round flat dense
                                        @click="reactivar('ambiente', props.row)">
                                        <q-tooltip>Reactivar ambiente</q-tooltip>
                                    </q-btn>
                                </q-td>
                            </template>
                        </q-table>
                    </q-card>
                </q-tab-panel>

                <!-- ── MATERIALES ──────────────────────────────────────────── -->
                <q-tab-panel name="items" class="q-pa-none">
                    <div class="row q-col-gutter-sm q-mb-sm">
                        <div class="col-12 col-sm-5">
                        </div>
                    </div>
                    <q-card flat class="table-card">
                        <q-table :rows="filteredItems" :columns="colItems" row-key="_id" flat
                            no-data-label="No hay materiales inhabilitados"
                            :rows-per-page-options="[10,25,0]" class="archive-table">
                            <template v-slot:body-cell-nombre="props">
                                <q-td :props="props">
                                    <div class="text-weight-medium text-grey-7">{{ props.row.nombre }}</div>
                                    <div class="text-caption text-grey-5">
                                        <q-icon name="meeting_room" size="11px" class="q-mr-xs"/>{{ props.row.aula?.nombre || '—' }}
                                        &nbsp;·&nbsp;
                                        <q-icon name="category" size="11px" class="q-mr-xs"/>{{ props.row.zona?.nombre || '—' }}
                                    </div>
                                    <!-- Estado de padres -->
                                    <div class="row q-mt-xs" style="gap:4px;">
                                        <q-badge v-if="props.row.zona && !props.row.zona.activo"
                                            color="red-2" text-color="red-9" style="font-size:9px;">
                                            <q-icon name="warning" size="10px" class="q-mr-xs"/>Sede inhabilitada
                                        </q-badge>
                                        <q-badge v-if="props.row.aula && !props.row.aula.activo"
                                            color="orange-2" text-color="orange-9" style="font-size:9px;">
                                            <q-icon name="warning" size="10px" class="q-mr-xs"/>Ambiente inhabilitado
                                        </q-badge>
                                        <q-badge
                                            v-if="(!props.row.zona || props.row.zona.activo) && (!props.row.aula || props.row.aula.activo)"
                                            color="green-2" text-color="green-9" style="font-size:9px;">
                                            <q-icon name="check" size="10px" class="q-mr-xs"/>Listo para reactivar
                                        </q-badge>
                                    </div>
                                </q-td>
                            </template>
                            <template v-slot:body-cell-stock="props">
                                <q-td :props="props" class="text-center text-caption text-grey-6">
                                    {{ props.row.cantidad_disponible }} / {{ props.row.cantidad_total_stock }}
                                </q-td>
                            </template>
                            <template v-slot:body-cell-tipo="props">
                                <q-td :props="props">
                                    <q-badge :color="props.row.tipo_categoria === 'Consumible' ? 'orange-2' : 'blue-2'"
                                        :text-color="props.row.tipo_categoria === 'Consumible' ? 'orange-9' : 'blue-9'"
                                        :label="props.row.tipo_categoria" style="font-size:10px;"/>
                                </q-td>
                            </template>
                            <template v-slot:body-cell-fecha="props">
                                <q-td :props="props" class="text-caption text-grey-6">{{ formatDate(props.row.updatedAt) }}</q-td>
                            </template>
                            <template v-slot:body-cell-acciones="props">
                                <q-td :props="props" class="text-center">
                                    <q-btn icon="visibility" color="positive" size="sm" round flat dense
                                        @click="reactivar('item', props.row)">
                                        <q-tooltip>Reactivar material</q-tooltip>
                                    </q-btn>
                                </q-td>
                            </template>
                        </q-table>
                    </q-card>
                </q-tab-panel>

                <!-- ── EQUIPOS ─────────────────────────────────────────────── -->
                <q-tab-panel name="equipos" class="q-pa-none">
                    <q-card flat class="table-card">
                        <q-table :rows="inactiveEquipos" :columns="colEquipos" row-key="_id" flat
                            no-data-label="No hay equipos inhabilitados"
                            :rows-per-page-options="[10,25,0]" class="archive-table">
                            <template v-slot:body-cell-nombre="props">
                                <q-td :props="props">
                                    <div class="text-weight-medium text-grey-7">{{ props.row.nombre }}</div>
                                    <div class="text-caption text-grey-5">
                                        <q-icon name="qr_code_2" size="11px" class="q-mr-xs"/>{{ props.row.numero_placa || '—' }}
                                        &nbsp;·&nbsp;{{ props.row.aula?.nombre || '—' }}
                                        &nbsp;·&nbsp;{{ props.row.zona?.nombre || '—' }}
                                    </div>
                                    <!-- Estado de padres -->
                                    <div class="row q-mt-xs" style="gap:4px;">
                                        <q-badge v-if="props.row.zona && !props.row.zona.activo"
                                            color="red-2" text-color="red-9" style="font-size:9px;">
                                            <q-icon name="warning" size="10px" class="q-mr-xs"/>Sede inhabilitada
                                        </q-badge>
                                        <q-badge v-if="props.row.aula && !props.row.aula.activo"
                                            color="orange-2" text-color="orange-9" style="font-size:9px;">
                                            <q-icon name="warning" size="10px" class="q-mr-xs"/>Ambiente inhabilitado
                                        </q-badge>
                                        <q-badge
                                            v-if="(!props.row.zona || props.row.zona.activo) && (!props.row.aula || props.row.aula.activo)"
                                            color="green-2" text-color="green-9" style="font-size:9px;">
                                            <q-icon name="check" size="10px" class="q-mr-xs"/>Listo para reactivar
                                        </q-badge>
                                    </div>
                                </q-td>
                            </template>
                            <template v-slot:body-cell-fecha="props">
                                <q-td :props="props" class="text-caption text-grey-6">{{ formatDate(props.row.updatedAt) }}</q-td>
                            </template>
                            <template v-slot:body-cell-acciones="props">
                                <q-td :props="props" class="text-center">
                                    <q-btn icon="visibility" color="positive" size="sm" round flat dense
                                        @click="reactivar('item', props.row)">
                                        <q-tooltip>Reactivar equipo</q-tooltip>
                                    </q-btn>
                                </q-td>
                            </template>
                        </q-table>
                    </q-card>
                </q-tab-panel>

                <!-- ── CUENTADANTES ────────────────────────────────────────── -->
                <q-tab-panel name="cuentadantes" class="q-pa-none">
                    <q-card flat class="table-card">
                        <q-table :rows="inactiveCuentadantes" :columns="colCuentadantes" row-key="_id" flat
                            no-data-label="No hay cuentadantes inhabilitados"
                            :rows-per-page-options="[10,25,0]" class="archive-table">
                            <template v-slot:body-cell-nombre="props">
                                <q-td :props="props">
                                    <div class="text-weight-medium text-grey-7">{{ props.row.nombre }}</div>
                                    <div class="text-caption text-grey-5">CC {{ props.row.numero_identificacion }}</div>
                                </q-td>
                            </template>
                            <template v-slot:body-cell-fecha="props">
                                <q-td :props="props" class="text-caption text-grey-6">{{ formatDate(props.row.updatedAt) }}</q-td>
                            </template>
                            <template v-slot:body-cell-acciones="props">
                                <q-td :props="props" class="text-center">
                                    <q-btn icon="visibility" color="positive" size="sm" round flat dense
                                        @click="reactivar('cuentadante', props.row)">
                                        <q-tooltip>Reactivar cuentadante</q-tooltip>
                                    </q-btn>
                                </q-td>
                            </template>
                        </q-table>
                    </q-card>
                </q-tab-panel>

            </q-tab-panels>
        </template>

        <!-- ── Dialog de confirmación de reactivación ─────────────────────── -->
        <q-dialog v-model="confirmDialog" persistent>
            <q-card style="width:460px;max-width:97vw;">
                <q-toolbar class="bg-positive text-white">
                    <q-icon name="visibility" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">Reactivar {{ tipoLabel }}</q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup :disable="reactivating"/>
                </q-toolbar>

                <q-card-section class="q-pt-md">
                    <div class="text-body1 q-mb-md">
                        ¿Deseas reactivar <strong>"{{ itemToReactivate?.nombre }}"</strong>?
                        El elemento volverá a ser visible en el sistema.
                    </div>

                    <!-- Contexto según tipo -->
                    <q-banner v-if="tipoReactivar === 'zona'" class="bg-blue-1 text-blue-9" rounded dense>
                        <template v-slot:avatar><q-icon name="info" color="blue-7"/></template>
                        <span class="text-caption">
                            Solo se reactiva la sede. Sus ambientes e ítems inhabilitados
                            deben reactivarse individualmente desde sus pestañas.
                        </span>
                    </q-banner>

                    <q-banner v-else-if="tipoReactivar === 'ambiente'" class="bg-blue-1 text-blue-9" rounded dense>
                        <template v-slot:avatar><q-icon name="info" color="blue-7"/></template>
                        <span class="text-caption">
                            Solo se reactiva el ambiente. Sus ítems inhabilitados deben
                            reactivarse individualmente desde las pestañas de Materiales o Equipos.
                            <br>Si la sede aún está inhabilitada, el sistema lo indicará.
                        </span>
                    </q-banner>

                    <q-banner v-else-if="tipoReactivar === 'item'" class="bg-blue-1 text-blue-9" rounded dense>
                        <template v-slot:avatar><q-icon name="info" color="blue-7"/></template>
                        <span class="text-caption">
                            Si la sede o el ambiente del ítem aún están inhabilitados,
                            el sistema te lo indicará y deberás reactivarlos primero.
                        </span>
                    </q-banner>
                </q-card-section>

                <q-card-actions align="right" class="q-px-md q-pb-md">
                    <q-btn flat label="Cancelar" color="grey" v-close-popup :disable="reactivating"/>
                    <q-btn unelevated label="Reactivar" color="positive" icon="visibility"
                        :loading="reactivating" @click="confirmarReactivar"/>
                </q-card-actions>
            </q-card>
        </q-dialog>

    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { itemsService, zonesService, classroomsService, cuentadantesService } from '../../services/items.js';

const $q = useQuasar();

const tab         = ref('zonas');
const loading     = ref(false);
const searchItems = ref('');

const inactiveZonas        = ref([]);
const inactiveAmbientes    = ref([]);
const inactiveItemsRaw     = ref([]);
const inactiveEquipos      = ref([]);
const inactiveCuentadantes = ref([]);

const confirmDialog    = ref(false);
const tipoReactivar    = ref('');
const itemToReactivate = ref(null);
const reactivating     = ref(false);

const tipoLabel = computed(() => {
    const mapa = { zona: 'sede', ambiente: 'ambiente', item: 'ítem', cuentadante: 'cuentadante' };
    return mapa[tipoReactivar.value] || '';
});

const counts = computed(() => ({
    zonas:        inactiveZonas.value.length        || 0,
    ambientes:    inactiveAmbientes.value.length    || 0,
    items:        inactiveItemsRaw.value.length     || 0,
    equipos:      inactiveEquipos.value.length      || 0,
    cuentadantes: inactiveCuentadantes.value.length || 0,
}));

const filteredItems = computed(() => {
    if (!searchItems.value) return inactiveItemsRaw.value;
    const q = searchItems.value.toLowerCase();
    return inactiveItemsRaw.value.filter(i => i.nombre.toLowerCase().includes(q));
});

/** Cuenta cuántos ambientes inhabilitados pertenecen a una sede dada. */
const contarAmbientesInactivos = (zonaId) =>
    inactiveAmbientes.value.filter(a => String(a.zona?._id || a.zona) === String(zonaId)).length;

// ── Columnas ──────────────────────────────────────────────────────────────────
const colZonas = [
    { name: 'nombre',   label: 'Sede',           align: 'left',   field: 'nombre',    sortable: true },
    { name: 'fecha',    label: 'Inhabilitado el', align: 'center', field: 'updatedAt', sortable: true, style: 'min-width:150px' },
    { name: 'acciones', label: 'Acciones',         align: 'center', field: 'acciones',                  style: 'width:80px' },
];
const colAmbientes = [
    { name: 'nombre',   label: 'Ambiente / Sede', align: 'left',   field: 'nombre',    sortable: true },
    { name: 'fecha',    label: 'Inhabilitado el', align: 'center', field: 'updatedAt', sortable: true, style: 'min-width:150px' },
    { name: 'acciones', label: 'Acciones',         align: 'center', field: 'acciones',                  style: 'width:80px' },
];
const colItems = [
    { name: 'nombre',   label: 'Material / Ubicación', align: 'left',   field: 'nombre',              sortable: true },
    { name: 'tipo',     label: 'Tipo',                 align: 'center', field: 'tipo_categoria',      sortable: true, style: 'width:140px' },
    { name: 'stock',    label: 'Stock',                align: 'center', field: 'cantidad_disponible', sortable: true, style: 'width:90px' },
    { name: 'fecha',    label: 'Inhabilitado el',      align: 'center', field: 'updatedAt',           sortable: true, style: 'min-width:150px' },
    { name: 'acciones', label: 'Acciones',              align: 'center', field: 'acciones',                             style: 'width:80px' },
];
const colEquipos = [
    { name: 'nombre',   label: 'Equipo / Placa',  align: 'left',   field: 'nombre',    sortable: true },
    { name: 'fecha',    label: 'Inhabilitado el', align: 'center', field: 'updatedAt', sortable: true, style: 'min-width:150px' },
    { name: 'acciones', label: 'Acciones',         align: 'center', field: 'acciones',                  style: 'width:80px' },
];
const colCuentadantes = [
    { name: 'nombre',   label: 'Cuentadante / CC', align: 'left',   field: 'nombre',    sortable: true },
    { name: 'fecha',    label: 'Inhabilitado el',  align: 'center', field: 'updatedAt', sortable: true, style: 'min-width:150px' },
    { name: 'acciones', label: 'Acciones',          align: 'center', field: 'acciones',                  style: 'width:80px' },
];

// ── Carga ─────────────────────────────────────────────────────────────────────
const loadAll = async () => {
    loading.value = true;
    try {
        const [zonas, ambientes, itemsAll, cuentadantes] = await Promise.all([
            zonesService.getInactivos(),
            classroomsService.getInactivos(),
            itemsService.getInactivos(),
            cuentadantesService.getInactivos(),
        ]);
        inactiveZonas.value        = zonas;
        inactiveAmbientes.value    = ambientes;
        inactiveItemsRaw.value     = itemsAll.filter(i => i.tipo_categoria !== 'Equipo O Maquinaria');
        inactiveEquipos.value      = itemsAll.filter(i => i.tipo_categoria === 'Equipo O Maquinaria');
        inactiveCuentadantes.value = cuentadantes;
    } catch (err) {
        $q.notify({ type: 'negative', message: 'Error cargando el archivo', position: 'top', timeout: 3000 });
    } finally {
        loading.value = false;
    }
};

// ── Reactivar ─────────────────────────────────────────────────────────────────
const reactivar = (tipo, item) => {
    tipoReactivar.value    = tipo;
    itemToReactivate.value = item;
    confirmDialog.value    = true;
};

const confirmarReactivar = async () => {
    if (!itemToReactivate.value) return;
    reactivating.value = true;
    try {
        const id = itemToReactivate.value._id;
        switch (tipoReactivar.value) {
            case 'zona':        await zonesService.reactivar(id);        break;
            case 'ambiente':    await classroomsService.reactivar(id);   break;
            case 'item':        await itemsService.reactivar(id);        break;
            case 'cuentadante': await cuentadantesService.reactivar(id); break;
        }
        $q.notify({
            type: 'positive',
            message: `"${itemToReactivate.value.nombre}" reactivado correctamente`,
            position: 'top',
            timeout: 3000,
        });
        confirmDialog.value    = false;
        itemToReactivate.value = null;
        await loadAll();
    } catch (err) {
        // El backend devuelve el mensaje exacto del bloqueo (ej: sede inhabilitada)
        $q.notify({
            type: 'negative',
            message: err.response?.data?.message || 'Error al reactivar',
            position: 'top',
            timeout: 5000,
        });
    } finally {
        reactivating.value = false;
    }
};

const formatDate = (ds) => {
    if (!ds) return '—';
    return new Date(ds).toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

onMounted(loadAll);
</script>

<style scoped>
.page-bg { background: #f5f5f5; }
.lh-tight { line-height: 1.2; }
.action-btn { border-radius: 8px !important; }

.header-icon-wrap {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #bf360c, #e64a19);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; box-shadow: 0 2px 8px rgba(230,74,25,.35);
}

.rounded-top { border-radius: 10px 10px 0 0; }

.table-card {
    border-radius: 0 0 12px 12px;
    border: 1px solid #e0e0e0;
    overflow: hidden;
    box-shadow: 0 1px 6px rgba(0,0,0,.06);
}

.archive-table :deep(thead tr th) {
    background: #fbe9e7 !important;
    color: #bf360c !important;
    font-weight: 700 !important;
    font-size: 11px !important;
    text-transform: uppercase !important;
    letter-spacing: .5px;
}
.archive-table :deep(tbody tr td) {
    padding: 10px 12px !important;
    vertical-align: top;
    color: #757575;
}
.archive-table :deep(tbody tr:hover td) {
    background: #fff3e0 !important;
}
</style>