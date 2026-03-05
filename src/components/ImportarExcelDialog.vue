<template>
    <!-- ── Botón de apertura por defecto ────────────────────────────── -->
    <q-btn
        outline
        :color="modulo === 'materiales' ? 'primary' : 'deep-purple'"
        icon="upload_file"
        label="Importar Excel"
        dense no-caps
        @click="abrirDialog"
        class="action-btn"
    />

    <!-- ── Dialog principal ─────────────────────────────────────────── -->
    <q-dialog v-model="dialogVisible" persistent style="z-index:7000">
        <q-card style="width: 900px; max-width: 97vw; max-height: 92vh; display:flex; flex-direction:column;">

            <!-- Toolbar -->
            <q-toolbar :class="modulo === 'materiales' ? 'bg-primary' : 'bg-green-10'" class="text-white" style="flex-shrink:0">
                <q-icon :name="modulo === 'materiales' ? 'inventory_2' : 'precision_manufacturing'" size="sm" class="q-mr-sm"/>
                <q-toolbar-title class="text-weight-bold">
                    Importar {{ modulo === 'materiales' ? 'Materiales' : 'Equipos y Maquinaria' }} desde Excel
                </q-toolbar-title>
                <q-btn flat round dense icon="close" @click="cerrar"/>
            </q-toolbar>

            <!-- Contenido scrollable -->
            <q-card-section style="overflow-y:auto; flex:1; padding: 16px;">

                <!-- PASO 1: subir archivo -->
                <div v-if="paso === 1">
                    <q-banner class="bg-green-1 text-green-10 q-mb-md" rounded>
                        <template v-slot:avatar>
                            <q-icon name="info" color="green-8"/>
                        </template>
                        <div class="text-subtitle2 q-mb-xs">Formato esperado del archivo Excel</div>
                        <div class="text-caption">
                            El archivo debe tener las siguientes columnas en la primera fila (encabezados):
                        </div>
                        <div class="q-mt-sm">
                            <q-chip v-for="col in columnasEsperadas" :key="col.campo"
                                dense square
                                :color="col.obligatorio ? 'blue-7' : 'grey-5'"
                                text-color="white"
                                class="q-mr-xs q-mb-xs"
                                :label="col.campo"
                            >
                                <q-tooltip>{{ col.descripcion }}</q-tooltip>
                            </q-chip>
                        </div>
                        <div class="text-caption q-mt-sm text-green-9">
                            <b>Azul = obligatorio</b> · Gris = opcional
                            <span v-if="modulo === 'equipos'"> · <b>numero_placa</b> es obligatorio para equipos</span>
                        </div>
                    </q-banner>

                    <!-- Advertencia sobre tipo_categoria -->
                    <q-banner class="bg-amber-1 text-amber-9 q-mb-md" rounded>
                        <template v-slot:avatar>
                            <q-icon name="warning" color="amber-8"/>
                        </template>
                        <div class="text-subtitle2 q-mb-xs">Sobre la columna <code>tipo_categoria</code></div>
                        <div class="text-caption">
                            Valores aceptados exactamente como aparecen:
                            <strong>Consumible</strong> · <strong>De Uso Controlado</strong> · <strong>Equipo O Maquinaria</strong>
                        </div>
                        <div v-if="modulo === 'materiales'" class="text-caption q-mt-xs">
                            ⚠️ Estás en el módulo de <b>Materiales</b>. Las filas con tipo <b>Equipo O Maquinaria</b> serán excluidas de esta importación y se te indicará cuántas fueron omitidas.
                        </div>
                        <div v-else class="text-caption q-mt-xs">
                            ⚠️ Estás en el módulo de <b>Equipos</b>. Las filas con tipo <b>Consumible</b> o <b>De Uso Controlado</b> serán excluidas de esta importación.
                        </div>
                    </q-banner>

                    <!-- Zona de arrastre / selección -->
                    <q-card
                        flat bordered
                        class="drag-zone q-pa-xl text-center cursor-pointer q-mb-md"
                        :class="arrastrandoArchivo ? 'drag-zone--active' : ''"
                        @dragover.prevent="arrastrandoArchivo = true"
                        @dragleave="arrastrandoArchivo = false"
                        @drop.prevent="onDrop"
                        @click="$refs.fileInput.click()"
                    >
                        <q-icon name="upload_file" size="56px" :color="arrastrandoArchivo ? 'primary' : 'grey-5'"/>
                        <div class="text-body1 text-grey-7 q-mt-sm">
                            Arrastra tu archivo Excel aquí o <span class="text-primary text-weight-bold">haz clic para seleccionar</span>
                        </div>
                        <div class="text-caption text-grey-5 q-mt-xs">.xlsx · .xls · máx. 10 MB</div>
                        <input
                            ref="fileInput"
                            type="file"
                            accept=".xlsx,.xls"
                            style="display:none"
                            @change="onFileSelected"
                        />
                    </q-card>

                    <!-- Archivo seleccionado -->
                    <div v-if="archivoSeleccionado" class="row items-center q-gutter-sm q-mb-md">
                        <q-icon name="description" color="green-7" size="24px"/>
                        <span class="text-body2 text-green-8 text-weight-medium">{{ archivoSeleccionado.name }}</span>
                        <q-chip dense color="green-1" text-color="green-8" :label="formatBytes(archivoSeleccionado.size)"/>
                        <q-btn flat round dense icon="close" color="grey" size="sm" @click="limpiarArchivo"/>
                    </div>

                    <!-- Botón descargar plantilla -->
                    <div class="row justify-between items-center q-mt-sm">
                        <q-btn
                            flat no-caps dense
                            icon="download"
                            label="Descargar plantilla de ejemplo"
                            color="grey-7"
                            @click="descargarPlantilla"
                        />
                        <q-btn
                            unelevated no-caps
                            icon="preview"
                            label="Previsualizar"
                            :color="modulo === 'materiales' ? 'primary' : 'deep-purple'"
                            :disable="!archivoSeleccionado"
                            :loading="procesando"
                            @click="procesarArchivo"
                        />
                    </div>
                </div>

                <!-- PASO 2: vista previa -->
                <div v-if="paso === 2">
                    <!-- Resumen de validación -->
                    <div class="row q-col-gutter-sm q-mb-md">
                        <div class="col-4">
                            <div class="resumen-chip resumen-chip--total">
                                <q-icon name="table_rows" size="20px"/>
                                <div>
                                    <div class="resumen-num">{{ filas.length }}</div>
                                    <div class="resumen-label">Total leídas</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="resumen-chip resumen-chip--ok">
                                <q-icon name="check_circle" size="20px"/>
                                <div>
                                    <div class="resumen-num">{{ filasValidas.length }}</div>
                                    <div class="resumen-label">Se importarán</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="resumen-chip resumen-chip--err">
                                <q-icon name="cancel" size="20px"/>
                                <div>
                                    <div class="resumen-num">{{ filasConError.length }}</div>
                                    <div class="resumen-label">Con problemas</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Aviso filas excluidas por módulo -->
                    <q-banner v-if="filasExcluidas > 0" class="bg-amber-1 text-amber-9 q-mb-sm" rounded dense>
                        <template v-slot:avatar><q-icon name="filter_alt" color="amber-8"/></template>
                        <b>{{ filasExcluidas }} fila(s)</b> excluidas porque no corresponden al módulo de
                        {{ modulo === 'materiales' ? 'Materiales' : 'Equipos y Maquinaria' }}.
                    </q-banner>

                    <!-- Aviso duplicados internos -->
                    <q-banner v-if="duplicadosInternos.length > 0" class="bg-orange-1 text-orange-9 q-mb-sm" rounded dense>
                        <template v-slot:avatar><q-icon name="content_copy" color="orange-8"/></template>
                        <b>{{ duplicadosInternos.length }} fila(s)</b> marcadas como duplicado dentro del archivo
                        (mismo nombre + sede + ambiente). Puedes editarlas o eliminarlas.
                    </q-banner>

                    <!-- Tabs ok / con errores -->
                    <q-tabs v-model="tabVista" dense align="left" :active-color="modulo === 'materiales' ? 'primary' : 'deep-purple'" class="q-mb-sm">
                        <q-tab name="validas" icon="check_circle" label="Válidas" :badge="filasValidas.length > 0 ? String(filasValidas.length) : undefined"/>
                        <q-tab name="errores" icon="error" label="Con problemas" :badge="filasConError.length > 0 ? String(filasConError.length) : undefined"/>
                    </q-tabs>

                    <q-tab-panels v-model="tabVista" animated>
                        <!-- Tab filas válidas -->
                        <q-tab-panel name="validas" class="q-pa-none">
                            <div v-if="filasValidas.length === 0" class="text-center q-py-lg text-grey-6">
                                <q-icon name="inbox" size="40px"/>
                                <div class="q-mt-sm">No hay filas válidas para importar</div>
                            </div>
                            <q-table
                                v-else
                                :rows="filasValidas"
                                :columns="columnasPreview"
                                row-key="_idx"
                                flat dense
                                :rows-per-page-options="[10, 25]"
                                class="preview-table"
                            >
                                <template v-slot:body-cell-tipo_categoria="props">
                                    <q-td :props="props">
                                        <q-chip dense square
                                            :color="chipCategoria(props.row.tipo_categoria).color"
                                            text-color="white"
                                            :label="props.row.tipo_categoria"
                                            size="sm"
                                        />
                                    </q-td>
                                </template>
                                <!-- NUEVO: acciones por fila -->
                                <template v-slot:body-cell-acciones="props">
                                    <q-td :props="props" class="text-center">
                                        <q-btn flat round dense icon="edit" color="primary" size="sm" @click="abrirEdicion(props.row)">
                                            <q-tooltip>Editar fila</q-tooltip>
                                        </q-btn>
                                        <q-btn flat round dense icon="delete" color="negative" size="sm" @click="eliminarFila(props.row._idx)">
                                            <q-tooltip>Eliminar del listado</q-tooltip>
                                        </q-btn>
                                    </q-td>
                                </template>
                            </q-table>
                        </q-tab-panel>

                        <!-- Tab filas con error -->
                        <q-tab-panel name="errores" class="q-pa-none">
                            <div v-if="filasConError.length === 0" class="text-center q-py-lg text-grey-6">
                                <q-icon name="check_circle" size="40px" color="positive"/>
                                <div class="q-mt-sm text-positive">¡Sin errores detectados!</div>
                            </div>
                            <q-table
                                v-else
                                :rows="filasConError"
                                :columns="columnasError"
                                row-key="_idx"
                                flat dense
                                :rows-per-page-options="[10, 25]"
                                class="preview-table"
                            >
                                <template v-slot:body-cell-errores="props">
                                    <q-td :props="props">
                                        <ul class="q-ma-none q-pl-md" style="font-size:12px; color:#b91c1c;">
                                            <li v-for="(e, i) in props.row._errores" :key="i">{{ e }}</li>
                                        </ul>
                                    </q-td>
                                </template>
                                <!-- NUEVO: acciones por fila con error -->
                                <template v-slot:body-cell-acciones="props">
                                    <q-td :props="props" class="text-center">
                                        <q-btn flat round dense icon="edit" color="warning" size="sm" @click="abrirEdicion(props.row)">
                                            <q-tooltip>Editar y corregir</q-tooltip>
                                        </q-btn>
                                        <q-btn flat round dense icon="delete" color="negative" size="sm" @click="eliminarFila(props.row._idx)">
                                            <q-tooltip>Eliminar del listado</q-tooltip>
                                        </q-btn>
                                    </q-td>
                                </template>
                            </q-table>
                        </q-tab-panel>
                    </q-tab-panels>
                </div>

                <!-- PASO 3: resultado de importación -->
                <div v-if="paso === 3" class="text-center q-py-lg">
                    <q-icon
                        :name="resultado.insertados > 0 ? 'check_circle' : 'error'"
                        :color="resultado.insertados > 0 ? 'positive' : 'negative'"
                        size="64px"
                    />
                    <div class="text-h6 q-mt-md">
                        {{ resultado.insertados > 0 ? '¡Importación completada!' : 'Importación sin registros exitosos' }}
                    </div>
                    <div class="row justify-center q-col-gutter-md q-mt-md">
                        <div class="col-auto">
                            <div class="resumen-chip resumen-chip--ok" style="min-width:120px">
                                <q-icon name="check" size="20px"/>
                                <div>
                                    <div class="resumen-num">{{ resultado.insertados }}</div>
                                    <div class="resumen-label">Registrados</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-auto">
                            <div class="resumen-chip resumen-chip--err" style="min-width:120px">
                                <q-icon name="close" size="20px"/>
                                <div>
                                    <div class="resumen-num">{{ resultado.fallidos }}</div>
                                    <div class="resumen-label">Fallidos</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Errores de inserción -->
                    <div v-if="resultado.errores && resultado.errores.length > 0" class="q-mt-lg text-left">
                        <div class="text-subtitle2 text-negative q-mb-sm">Detalle de errores:</div>
                        <q-list bordered separator class="rounded-borders">
                            <q-item v-for="(err, i) in resultado.errores" :key="i" dense>
                                <q-item-section avatar>
                                    <q-icon name="error" color="negative" size="sm"/>
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label class="text-weight-medium">Fila {{ err.fila }}: {{ err.nombre }}</q-item-label>
                                    <q-item-label caption class="text-negative">{{ err.errores.join(' · ') }}</q-item-label>
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </div>
                </div>

            </q-card-section>

            <!-- Acciones del dialog -->
            <q-card-actions align="right" style="flex-shrink:0; border-top: 1px solid #e0e0e0; padding: 12px 16px;">
                <q-btn flat label="Cancelar" color="grey" @click="cerrar" v-if="paso !== 3"/>
                <q-btn
                    v-if="paso === 2"
                    flat label="Volver"
                    color="grey"
                    icon="arrow_back"
                    @click="paso = 1"
                />
                <q-btn
                    v-if="paso === 2"
                    unelevated no-caps
                    icon="upload"
                    label="Confirmar e importar"
                    :color="modulo === 'materiales' ? 'primary' : 'deep-purple'"
                    :disable="filasValidas.length === 0"
                    :loading="importando"
                    @click="confirmarImportacion"
                />
                <q-btn
                    v-if="paso === 3"
                    unelevated no-caps
                    icon="close"
                    label="Cerrar"
                    :color="modulo === 'materiales' ? 'primary' : 'deep-purple'"
                    @click="cerrar"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>

    <!-- ── NUEVO: Dialog de edición de fila ──────────────────────────── -->
    <q-dialog v-model="editDialog" persistent style="z-index:8000">
        <q-card style="width: 540px; max-width: 97vw;">
            <q-toolbar :class="modulo === 'materiales' ? 'bg-primary' : 'bg-green-10'" class="text-white">
                <q-icon name="edit" size="sm" class="q-mr-sm"/>
                <q-toolbar-title class="text-weight-bold">
                    Editar ítem — fila {{ editForm._fila }}
                </q-toolbar-title>
                <q-btn flat round dense icon="close" @click="editDialog = false"/>
            </q-toolbar>

            <q-card-section class="q-gutter-sm q-pt-md">
                <q-input
                    v-model="editForm.nombre"
                    label="Nombre *"
                    outlined dense
                    :rules="[v => !!v || 'Obligatorio', v => v.length <= 150 || 'Máx. 150 caracteres']"
                />
                <q-input
                    v-model="editForm.descripcion"
                    label="Descripción"
                    outlined dense
                    type="textarea"
                    rows="2"
                />
                <q-select
                    v-model="editForm.tipo_categoria"
                    :options="tiposPermitidos"
                    label="Categoría *"
                    outlined dense
                />
                <q-input
                    v-model="editForm.zona"
                    label="Sede (Zona) *"
                    outlined dense
                    :rules="[v => !!v || 'Obligatorio']"
                />
                <q-input
                    v-model="editForm.aula"
                    label="Ambiente (Aula) *"
                    outlined dense
                    :rules="[v => !!v || 'Obligatorio']"
                />
                <q-input
                    v-model.number="editForm.cantidad_total_stock"
                    label="Cantidad *"
                    outlined dense
                    type="number"
                    min="0"
                    :rules="[v => v >= 0 || 'Debe ser ≥ 0']"
                />
                <q-input
                    v-if="editForm.tipo_categoria === 'Equipo O Maquinaria'"
                    v-model="editForm.numero_placa"
                    label="Número de placa *"
                    outlined dense
                    :rules="[v => !!v || 'Obligatorio para equipos']"
                />

                <!-- Alerta duplicado en tiempo real -->
                <q-banner v-if="editDuplicadoAlerta" class="bg-orange-1 text-orange-9" rounded dense>
                    <template v-slot:avatar><q-icon name="warning" color="orange-8"/></template>
                    Ya existe otra fila con el mismo nombre, sede y ambiente en este listado.
                </q-banner>
            </q-card-section>

            <q-card-actions align="right" class="q-px-md q-pb-md">
                <q-btn flat label="Cancelar" color="grey" @click="editDialog = false"/>
                <q-btn
                    unelevated no-caps
                    icon="save"
                    label="Guardar cambios"
                    :color="modulo === 'materiales' ? 'primary' : 'deep-purple'"
                    @click="guardarEdicion"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import * as XLSX from 'xlsx';
import { itemsService } from '.././services/items.js';

// ── Props ────────────────────────────────────────────────────────────────────
const props = defineProps({
    modulo: {
        type: String,
        required: true,
        validator: v => ['materiales', 'equipos'].includes(v)
    }
});

const emit = defineEmits(['importado']);
const $q = useQuasar();

// ── Estado ───────────────────────────────────────────────────────────────────
const dialogVisible      = ref(false);
const paso               = ref(1);
const arrastrandoArchivo = ref(false);
const archivoSeleccionado = ref(null);
const procesando         = ref(false);
const importando         = ref(false);
const tabVista           = ref('validas');
const filasExcluidas     = ref(0);
const resultado          = ref({ insertados: 0, fallidos: 0, errores: [] });
const filas              = ref([]);

// ── Estado edición ───────────────────────────────────────────────────────────
const editDialog      = ref(false);
const editForm        = ref({});
const editIdxOriginal = ref(null);

// ── Tipos por módulo ─────────────────────────────────────────────────────────
const TIPOS_MATERIALES = ['Consumible', 'De Uso Controlado'];
const TIPOS_EQUIPOS    = ['Equipo O Maquinaria'];
const TODOS_TIPOS      = [...TIPOS_MATERIALES, ...TIPOS_EQUIPOS];

const tiposPermitidos = computed(() =>
    props.modulo === 'materiales' ? TIPOS_MATERIALES : TIPOS_EQUIPOS
);

// ── Computed ─────────────────────────────────────────────────────────────────
const filasValidas  = computed(() => filas.value.filter(f => f._valida));
const filasConError = computed(() => filas.value.filter(f => !f._valida));

// Duplicados internos: mismo nombre + zona + aula
const duplicadosInternos = computed(() => {
    const clave = f => `${(f.nombre||'').toLowerCase()}|${(f.zona||'').toLowerCase()}|${(f.aula||'').toLowerCase()}`;
    const conteo = {};
    filas.value.forEach(f => { const k = clave(f); conteo[k] = (conteo[k] || 0) + 1; });
    return filas.value.filter(f => conteo[clave(f)] > 1);
});

// Alerta en tiempo real dentro del form de edición
const editDuplicadoAlerta = computed(() => {
    if (!editForm.value.nombre) return false;
    const clave = `${editForm.value.nombre.toLowerCase()}|${(editForm.value.zona||'').toLowerCase()}|${(editForm.value.aula||'').toLowerCase()}`;
    return filas.value.some((f, i) => {
        if (i === editIdxOriginal.value) return false;
        return `${(f.nombre||'').toLowerCase()}|${(f.zona||'').toLowerCase()}|${(f.aula||'').toLowerCase()}` === clave;
    });
});

// ── Columnas ─────────────────────────────────────────────────────────────────
const columnasPreview = [
    { name: 'nombre',               label: 'Nombre',    align: 'left',   field: 'nombre',               sortable: true },
    { name: 'tipo_categoria',       label: 'Categoría', align: 'center', field: 'tipo_categoria',       sortable: true },
    { name: 'zona',                 label: 'Sede',      align: 'left',   field: 'zona',                 sortable: true },
    { name: 'aula',                 label: 'Ambiente',  align: 'left',   field: 'aula',                 sortable: true },
    { name: 'cantidad_total_stock', label: 'Cantidad',  align: 'center', field: 'cantidad_total_stock', sortable: true },
    { name: 'numero_placa',         label: 'N° Placa',  align: 'center', field: 'numero_placa',         sortable: true },
    { name: 'acciones',             label: '',          align: 'center', field: 'acciones',             style: 'width:90px' },
];

const columnasError = [
    { name: 'fila',     label: 'Fila',    align: 'center', field: '_fila',    sortable: true, style: 'width:60px' },
    { name: 'nombre',   label: 'Nombre',  align: 'left',   field: 'nombre',   sortable: true },
    { name: 'errores',  label: 'Errores', align: 'left',   field: '_errores' },
    { name: 'acciones', label: '',        align: 'center', field: 'acciones', style: 'width:90px' },
];

const columnasEsperadas = [
    { campo: 'nombre',               obligatorio: true,  descripcion: 'Nombre del ítem (máx. 150 caracteres).' },
    { campo: 'descripcion',          obligatorio: false, descripcion: 'Descripción opcional.' },
    { campo: 'tipo_categoria',       obligatorio: true,  descripcion: 'Consumible | De Uso Controlado | Equipo O Maquinaria' },
    { campo: 'zona',                 obligatorio: true,  descripcion: 'Nombre exacto de la sede.' },
    { campo: 'aula',                 obligatorio: true,  descripcion: 'Nombre exacto del ambiente.' },
    { campo: 'cantidad_total_stock', obligatorio: true,  descripcion: 'Número entero ≥ 0.' },
    { campo: 'numero_placa',         obligatorio: false, descripcion: 'Obligatorio para Equipo O Maquinaria. Debe ser único.' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const chipCategoria = (tipo) => {
    if (tipo === 'Consumible')        return { color: 'orange-7' };
    if (tipo === 'De Uso Controlado') return { color: 'blue-7' };
    return { color: 'deep-purple-7' };
};

// ── Revalidar fila tras edición ──────────────────────────────────────────────
const revalidarFila = (fila, placasEnLote) => {
    const errores = [];

    if (!fila.nombre) errores.push('nombre es obligatorio');
    if (fila.nombre && fila.nombre.length > 150) errores.push('nombre supera 150 caracteres');
    if (!tiposPermitidos.value.includes(fila.tipo_categoria)) errores.push(`tipo_categoria inválido: "${fila.tipo_categoria}"`);
    if (!fila.zona) errores.push('zona (Sede) es obligatoria');
    if (!fila.aula) errores.push('aula (Ambiente) es obligatoria');

    const cant = Number(fila.cantidad_total_stock);
    if (fila.cantidad_total_stock === '' || isNaN(cant) || cant < 0) {
        errores.push('cantidad_total_stock debe ser un número ≥ 0');
    }

    if (fila.tipo_categoria === 'Equipo O Maquinaria') {
        const placa = (fila.numero_placa || '').trim().toUpperCase();
        if (!placa) {
            errores.push('numero_placa es obligatorio para Equipos O Maquinaria');
        } else if (placasEnLote && placasEnLote.has(placa)) {
            errores.push(`Placa "${placa}" duplicada dentro del archivo`);
        }
    }

    fila._errores = errores;
    fila._valida  = errores.length === 0;
};

// ── Acciones de archivo ──────────────────────────────────────────────────────
const abrirDialog = () => {
    paso.value = 1;
    limpiarArchivo();
    dialogVisible.value = true;
};

const cerrar = () => {
    dialogVisible.value = false;
    if (paso.value === 3 && resultado.value.insertados > 0) {
        emit('importado');
    }
};

const limpiarArchivo = () => {
    archivoSeleccionado.value = null;
    filas.value = [];
    filasExcluidas.value = 0;
    tabVista.value = 'validas';
};

const onFileSelected = (event) => {
    const file = event.target.files[0];
    if (file) validarYAsignarArchivo(file);
    event.target.value = '';
};

const onDrop = (event) => {
    arrastrandoArchivo.value = false;
    const file = event.dataTransfer.files[0];
    if (file) validarYAsignarArchivo(file);
};

const validarYAsignarArchivo = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(ext)) {
        $q.notify({ type: 'warning', message: 'Solo se aceptan archivos .xlsx o .xls', position: 'top', timeout: 3000 });
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        $q.notify({ type: 'warning', message: 'El archivo no debe superar 10 MB', position: 'top', timeout: 3000 });
        return;
    }
    archivoSeleccionado.value = file;
};

// ── Procesamiento del Excel ──────────────────────────────────────────────────
const procesarArchivo = async () => {
    if (!archivoSeleccionado.value) return;
    procesando.value = true;

    try {
        const buffer = await archivoSeleccionado.value.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawRows.length === 0) {
            $q.notify({ type: 'warning', message: 'El archivo está vacío o no tiene filas de datos', position: 'top', timeout: 3000 });
            procesando.value = false;
            return;
        }
        if (rawRows.length > 500) {
            $q.notify({ type: 'warning', message: 'El archivo supera el límite de 500 ítems por importación', position: 'top', timeout: 4000 });
            procesando.value = false;
            return;
        }

        // Registrar placas y claves nombre+zona+aula para detectar duplicados internos
        const placasEnLote = new Set();
        const clavesFila   = new Map(); // clave → número de fila Excel del primer duplicado

        let excluidas = 0;
        const filasParseadas = [];

        rawRows.forEach((raw, idx) => {
            const tipo_categoria = String(raw.tipo_categoria || '').trim();

            // Excluir filas que no corresponden a este módulo
            if (TODOS_TIPOS.includes(tipo_categoria) && !tiposPermitidos.value.includes(tipo_categoria)) {
                excluidas++;
                return;
            }

            const errores = [];

            const nombre = String(raw.nombre || '').trim();
            if (!nombre) errores.push('nombre es obligatorio');
            if (nombre.length > 150) errores.push('nombre supera 150 caracteres');

            if (!tiposPermitidos.value.includes(tipo_categoria)) {
                errores.push(`tipo_categoria inválido: "${tipo_categoria}"`);
            }

            const zona = String(raw.zona || '').trim();
            if (!zona) errores.push('zona (Sede) es obligatoria');

            const aula = String(raw.aula || '').trim();
            if (!aula) errores.push('aula (Ambiente) es obligatoria');

            const cantRaw = String(raw.cantidad_total_stock ?? '').trim();
            const cantidad = parseInt(cantRaw, 10);
            if (cantRaw === '' || isNaN(cantidad) || cantidad < 0) {
                errores.push('cantidad_total_stock debe ser un número ≥ 0');
            }

            // Validación de placa para equipos
            let numero_placa = null;
            if (tipo_categoria === 'Equipo O Maquinaria') {
                numero_placa = String(raw.numero_placa || '').trim().toUpperCase();
                if (!numero_placa) {
                    errores.push('numero_placa es obligatorio para Equipos O Maquinaria');
                } else if (placasEnLote.has(numero_placa)) {
                    errores.push(`Placa "${numero_placa}" duplicada dentro del archivo`);
                } else {
                    placasEnLote.add(numero_placa);
                }
            }

            // Validación duplicado interno: mismo nombre + zona + aula
            if (nombre && zona && aula) {
                const clave = `${nombre.toLowerCase()}|${zona.toLowerCase()}|${aula.toLowerCase()}`;
                if (clavesFila.has(clave)) {
                    errores.push(`Ítem duplicado en este archivo (igual a fila ${clavesFila.get(clave)})`);
                } else {
                    clavesFila.set(clave, idx + 2);
                }
            }

            filasParseadas.push({
                _idx: idx,
                _fila: idx + 2,
                _valida: errores.length === 0,
                _errores: errores,
                nombre,
                descripcion: String(raw.descripcion || '').trim(),
                tipo_categoria,
                zona,
                aula,
                cantidad_total_stock: isNaN(cantidad) ? '' : cantidad,
                numero_placa: numero_placa || '',
            });
        });

        filas.value = filasParseadas;
        filasExcluidas.value = excluidas;
        paso.value = 2;
        tabVista.value = filasParseadas.some(f => f._valida) ? 'validas' : 'errores';

    } catch (err) {
        console.error('Error procesando Excel:', err);
        $q.notify({ type: 'negative', message: 'No se pudo leer el archivo. Verifica que sea un Excel válido.', position: 'top', timeout: 4000 });
    } finally {
        procesando.value = false;
    }
};

// ── Edición de fila ──────────────────────────────────────────────────────────
const abrirEdicion = (fila) => {
    editIdxOriginal.value = filas.value.findIndex(f => f._idx === fila._idx);
    editForm.value = { ...fila };
    editDialog.value = true;
};

const guardarEdicion = () => {
    if (editIdxOriginal.value === null) return;

    // Normalizar placa
    if (editForm.value.tipo_categoria === 'Equipo O Maquinaria') {
        editForm.value.numero_placa = (editForm.value.numero_placa || '').trim().toUpperCase();
    } else {
        editForm.value.numero_placa = '';
    }

    // Set de placas de otras filas (excluir la que se está editando)
    const placasEnLote = new Set(
        filas.value
            .filter((f, i) => i !== editIdxOriginal.value && f.tipo_categoria === 'Equipo O Maquinaria' && f.numero_placa)
            .map(f => f.numero_placa)
    );

    const filaActualizada = { ...editForm.value };
    revalidarFila(filaActualizada, placasEnLote);

    filas.value[editIdxOriginal.value] = filaActualizada;
    filas.value = [...filas.value]; // forzar reactividad

    editDialog.value = false;
    editIdxOriginal.value = null;

    $q.notify({
        type: filaActualizada._valida ? 'positive' : 'warning',
        message: filaActualizada._valida
            ? 'Fila actualizada correctamente'
            : 'Fila actualizada pero aún tiene errores',
        position: 'top',
        timeout: 2500
    });
};

// ── Eliminar fila del listado ────────────────────────────────────────────────
const eliminarFila = (idx) => {
    filas.value = filas.value.filter(f => f._idx !== idx);
    $q.notify({ type: 'info', message: 'Fila eliminada del listado', position: 'top', timeout: 1800 });
};

// ── Confirmación e importación ───────────────────────────────────────────────
const confirmarImportacion = async () => {
    if (filasValidas.value.length === 0) return;
    importando.value = true;

    try {
        const payload = filasValidas.value.map(f => ({
            nombre:               f.nombre,
            descripcion:          f.descripcion || undefined,
            tipo_categoria:       f.tipo_categoria,
            zona:                 f.zona,
            aula:                 f.aula,
            cantidad_total_stock: f.cantidad_total_stock,
            numero_placa:         f.numero_placa || undefined,
        }));

        resultado.value = await itemsService.bulkCreate(payload);
        paso.value = 3;

        if (resultado.value.insertados > 0) {
            $q.notify({
                type: 'positive',
                message: `${resultado.value.insertados} ítem(s) importados exitosamente`,
                position: 'top',
                icon: 'check_circle',
                timeout: 3000
            });
        }
    } catch (err) {
        console.error('Error en importación masiva:', err);
        $q.notify({
            type: 'negative',
            message: err.response?.data?.message || 'Error al importar los ítems',
            position: 'top',
            timeout: 4000
        });
    } finally {
        importando.value = false;
    }
};

// ── Plantilla de ejemplo ─────────────────────────────────────────────────────
const descargarPlantilla = () => {
    const ejemploMateriales = [
        { nombre: 'Marcadores borrables', descripcion: 'Caja x 12', tipo_categoria: 'Consumible', zona: 'Sede Principal', aula: 'Aula 101', cantidad_total_stock: 50, numero_placa: '' },
        { nombre: 'Bisturí de precisión', descripcion: '', tipo_categoria: 'De Uso Controlado', zona: 'Sede Norte', aula: 'Taller Corte', cantidad_total_stock: 10, numero_placa: '' },
    ];
    const ejemploEquipos = [
        { nombre: 'Taladro de banco', descripcion: 'Taladro 500W', tipo_categoria: 'Equipo O Maquinaria', zona: 'Sede Principal', aula: 'Taller 1', cantidad_total_stock: 1, numero_placa: 'SENA-001' },
        { nombre: 'Fresadora CNC', descripcion: '', tipo_categoria: 'Equipo O Maquinaria', zona: 'Sede Norte', aula: 'Taller CNC', cantidad_total_stock: 1, numero_placa: 'SENA-002' },
    ];

    const ejemplos = props.modulo === 'materiales' ? [...ejemploMateriales] : [...ejemploEquipos];

    if (props.modulo === 'materiales') {
        ejemplos.push({ nombre: 'Taladro (SERÁ EXCLUIDO)', descripcion: 'Este ítem es equipo y será ignorado en este módulo', tipo_categoria: 'Equipo O Maquinaria', zona: 'Sede Principal', aula: 'Taller 1', cantidad_total_stock: 1, numero_placa: 'SENA-099' });
    } else {
        ejemplos.push({ nombre: 'Marcadores (SERÁ EXCLUIDO)', descripcion: 'Este ítem es material y será ignorado en este módulo', tipo_categoria: 'Consumible', zona: 'Sede Principal', aula: 'Aula 101', cantidad_total_stock: 30, numero_placa: '' });
    }

    const ws = XLSX.utils.json_to_sheet(ejemplos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Items');
    XLSX.writeFile(wb, `plantilla_${props.modulo}.xlsx`);
};
</script>

<style scoped>
.action-btn { border-radius: 8px !important; }

/* Zona de arrastre */
.drag-zone {
    border: 2px dashed #cccccc;
    border-radius: 12px;
    transition: all .2s;
    background: #f7fbf2;
}
.drag-zone:hover, .drag-zone--active {
    border-color: #1a4f00;
    background: rgba(57, 169, 0, .04);
}

/* Resumen chips */
.resumen-chip {
    border-radius: 10px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 2px solid transparent;
}
.resumen-chip--total { background: #f0faf0; color: #39A900; border-color: #d4f0b0; }
.resumen-chip--ok    { background: #f0fdf4; color: #39A900; border-color: #d4f0b0; }
.resumen-chip--err   { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
.resumen-num   { font-size: 22px; font-weight: 700; line-height: 1; }
.resumen-label { font-size: 11px; font-weight: 500; opacity: .8; }

/* Tabla preview */
.preview-table :deep(thead tr th) {
    background: #f0f0f0 !important;
    color: #616161 !important;
    font-weight: 600 !important;
    font-size: 11px !important;
    text-transform: uppercase !important;
}
</style>