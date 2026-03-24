<template>
    <q-btn
        outline
        :color="modulo === 'materiales' ? 'primary' : 'deep-purple'"
        icon="upload_file"
        label="Importar Excel"
        dense no-caps
        @click="abrirDialog"
        class="action-btn"
    />

    <q-dialog v-model="dialogVisible" persistent style="z-index:6000">
        <q-card style="width: 980px; max-width: 98vw; max-height: 94vh; display:flex; flex-direction:column;">

            <q-toolbar :class="modulo === 'materiales' ? 'bg-primary' : 'bg-green-10'" class="text-white" style="flex-shrink:0">
                <q-icon :name="modulo === 'materiales' ? 'inventory_2' : 'precision_manufacturing'" size="sm" class="q-mr-sm"/>
                <q-toolbar-title class="text-weight-bold">
                    Importar {{ modulo === 'materiales' ? 'Materiales' : 'Equipos y Maquinaria' }} desde Excel
                </q-toolbar-title>
                <q-btn flat round dense icon="close" @click="cerrar"/>
            </q-toolbar>

            <q-card-section v-if="paso === 1" style="overflow-y:auto; flex:1; padding:16px;">

                <q-banner class="bg-green-1 text-green-10 q-mb-md" rounded>
                    <template v-slot:avatar><q-icon name="info" color="green-8"/></template>
                    <div class="text-subtitle2 q-mb-xs">Columnas requeridas en el Excel</div>
                    <div class="text-caption q-mb-sm">
                        La <b>categoría</b>, <b>sede</b> y <b>ambiente</b> se asignan desde este panel — no hacen falta en el archivo.
                    </div>
                    <div>
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
                    <div class="text-caption q-mt-xs text-green-9">
                        <b>Azul = obligatorio</b> · Gris = opcional
                        <span v-if="modulo === 'equipos'"> · <b>numero_placa</b> obligatorio para equipos</span>
                        <span v-else> · Ítems con <b>numero_placa</b> se excluyen automáticamente (son equipos)</span>
                    </div>
                </q-banner>

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
                        Arrastra tu archivo Excel aquí o
                        <span class="text-primary text-weight-bold">haz clic para seleccionar</span>
                    </div>
                    <div class="text-caption text-grey-5 q-mt-xs">.xlsx · .xls · máx. 10 MB</div>
                    <input ref="fileInput" type="file" accept=".xlsx,.xls" style="display:none" @change="onFileSelected"/>
                </q-card>

                <div v-if="archivoSeleccionado" class="row items-center q-gutter-sm q-mb-md">
                    <q-icon name="description" color="green-7" size="24px"/>
                    <span class="text-body2 text-green-8 text-weight-medium">{{ archivoSeleccionado.name }}</span>
                    <q-chip dense color="green-1" text-color="green-8" :label="formatBytes(archivoSeleccionado.size)"/>
                    <q-btn flat round dense icon="close" color="grey" size="sm" @click="limpiarArchivo"/>
                </div>

                <div class="row justify-between items-center q-mt-sm">
                    <q-btn flat no-caps dense icon="download" label="Descargar plantilla" color="grey-7"
                        :loading="generandoPlantilla" @click="descargarPlantilla">
                        <q-tooltip>Plantilla sin columnas de categoría, sede ni ambiente</q-tooltip>
                    </q-btn>
                    <q-btn unelevated no-caps icon="navigate_next" label="Siguiente"
                        :color="modulo === 'materiales' ? 'primary' : 'deep-purple'"
                        :disable="!archivoSeleccionado" :loading="procesando"
                        @click="procesarArchivo"/>
                </div>
            </q-card-section>

            <template v-if="paso === 2">

                <div class="destino-bar q-px-md q-py-sm" style="flex-shrink:0;">
                    <div class="row items-center q-mb-xs">
                        <q-icon name="tune" size="14px" color="grey-6" class="q-mr-xs"/>
                        <span class="text-caption text-weight-medium text-grey-6" style="text-transform:uppercase;letter-spacing:.6px;">
                            Destino global · se aplica a todas las filas sin asignación propia
                        </span>
                    </div>
                    <div class="row items-start q-col-gutter-sm">

                        <div v-if="modulo === 'materiales'" class="col-12 col-sm-3">
                            <q-select
                                v-model="destinoForm.tipo_categoria"
                                :options="tiposPermitidos"
                                label="Categoría *"
                                outlined dense
                                color="primary"
                                behavior="menu"
                                :rules="[v => !!v || 'Obligatorio']"
                                hide-bottom-space
                                @update:model-value="onGlobalTipoChange"
                            >
                                <template v-slot:prepend><q-icon name="style" size="xs"/></template>
                                <template v-slot:option="scope">
                                    <q-item v-bind="scope.itemProps">
                                        <q-item-section>
                                            <q-item-label>{{ scope.opt }}</q-item-label>
                                            <q-item-label caption>
                                                {{ scope.opt === 'Consumible' ? 'Papelería, insumos, reactivos…' : 'Herramientas, laboratorio…' }}
                                            </q-item-label>
                                        </q-item-section>
                                    </q-item>
                                </template>
                            </q-select>
                        </div>
                        <div v-else class="col-12 col-sm-3">
                            <q-input model-value="Equipo O Maquinaria" label="Categoría" outlined dense readonly bg-color="grey-2">
                                <template v-slot:prepend><q-icon name="precision_manufacturing" size="xs" color="deep-purple-6"/></template>
                            </q-input>
                        </div>

                        <div class="col-12 col-sm-4">
                            <q-select
                                v-model="destinoForm.zonaObj"
                                :options="editZonas"
                                option-label="nombre"
                                option-value="_id"
                                label="Sede *"
                                outlined dense
                                :color="modulo === 'materiales' ? 'primary' : 'deep-purple'"
                                :loading="cargandoUbicaciones"
                                behavior="menu"
                                @update:model-value="onGlobalZonaChange"
                                :rules="[v => !!v || 'La sede es obligatoria']"
                                hide-bottom-space
                            >
                                <template v-slot:prepend><q-icon name="category" size="xs"/></template>
                            </q-select>
                        </div>

                        <div class="col-12 col-sm-4">
                            <q-select
                                v-model="destinoForm.aulaObj"
                                :options="aulasFiltradas"
                                option-label="nombre"
                                option-value="_id"
                                label="Ambiente *"
                                outlined dense
                                :color="modulo === 'materiales' ? 'primary' : 'deep-purple'"
                                :disable="!destinoForm.zonaObj"
                                :hint="!destinoForm.zonaObj ? 'Selecciona una sede primero' : ''"
                                behavior="menu"
                                :rules="[v => !!v || 'El ambiente es obligatorio']"
                                hide-bottom-space
                                @update:model-value="onGlobalAulaChange"
                            >
                                <template v-slot:prepend><q-icon name="meeting_room" size="xs"/></template>
                            </q-select>
                        </div>

                        <div class="col-12 col-sm-4">
                            <q-select
                                v-model="destinoForm.cuentadanteObj"
                                :options="editCuentadantes"
                                option-label="nombre"
                                option-value="_id"
                                label="Cuentadante *"
                                outlined dense
                                :color="modulo === 'materiales' ? 'primary' : 'deep-purple'"
                                behavior="menu"
                                :rules="[v => !!v || 'El cuentadante es obligatorio']"
                                hide-bottom-space
                                @update:model-value="onGlobalCuentadanteChange"
                            >
                                <template v-slot:prepend><q-icon name="badge" size="xs"/></template>
                                <template v-slot:option="scope">
                                    <q-item v-bind="scope.itemProps">
                                        <q-item-section>
                                            <q-item-label>{{ scope.opt.nombre }}</q-item-label>
                                            <q-item-label caption>CC {{ scope.opt.numero_identificacion }}</q-item-label>
                                        </q-item-section>
                                    </q-item>
                                </template>
                                <template v-slot:no-option>
                                    <q-item>
                                        <q-item-section class="text-grey-6 text-caption">
                                            No hay cuentadantes. Ve a Sistema › Cuentadantes para crearlos.
                                        </q-item-section>
                                    </q-item>
                                </template>
                            </q-select>
                        </div>

                    </div>

                    <div class="row items-center q-mt-sm q-gutter-xs">
                        <q-chip dense square color="blue-1"  text-color="blue-9"   icon="table_rows"   :label="`${filas.length} leídos`"/>
                        <q-chip dense square color="green-1" text-color="green-9"  icon="check_circle" :label="`${filasValidas.length} válidos`"/>
                        <q-chip v-if="filasConError.length"  dense square color="red-1"   text-color="red-9"   icon="cancel"      :label="`${filasConError.length} con error`"/>
                        <q-chip v-if="filasExcluidas.length > 0" dense square color="amber-1" text-color="amber-9" icon="filter_alt" :label="`${filasExcluidas.length} excluidos`">
                            <q-tooltip>
                                {{ modulo === 'materiales'
                                    ? 'Tenían número de placa SENA → pertenecen al módulo de Equipos'
                                    : 'Sin número de placa SENA → pertenecen al módulo de Materiales' }}
                            </q-tooltip>
                        </q-chip>
                        <q-space/>
                        <div v-if="todasFilasConDestino" class="text-caption text-positive text-weight-medium">
                            <q-icon name="check_circle" size="14px"/> Destino asignado
                        </div>
                        <div v-else class="text-caption text-orange-8 text-weight-medium">
                            <q-icon name="warning" size="14px"/> Completa sede y ambiente
                        </div>
                    </div>
                </div>

                <div style="overflow-y:auto; flex:1; padding:12px 16px;">

                    <q-banner v-if="filasExcluidas.length > 0" class="bg-amber-1 text-amber-9 q-mb-sm" rounded dense>
                        <template v-slot:avatar><q-icon name="filter_alt" color="amber-8"/></template>
                        <b>{{ filasExcluidas.length }} fila(s)</b> excluidas automáticamente:
                        <span v-if="modulo === 'materiales'">contienen <b>número de placa SENA</b> → pertenecen al módulo de Equipos y Maquinaria.</span>
                        <span v-else>no tienen <b>número de placa SENA</b> → pertenecen al módulo de Materiales.</span>
                    </q-banner>

                    <q-tabs v-model="tabVista" dense align="left"
                        :active-color="modulo === 'materiales' ? 'primary' : 'deep-purple'" class="q-mb-sm">
                        <q-tab name="validas" icon="check_circle" label="Válidos"
                            :badge="filasValidas.length > 0 ? String(filasValidas.length) : undefined"/>
                        <q-tab name="errores" icon="error" label="Con problemas"
                            :badge="filasConError.length > 0 ? String(filasConError.length) : undefined"/>
                        <q-tab name="excluidos" icon="filter_alt" label="Excluidos"
                            :badge="filasExcluidas.length > 0 ? String(filasExcluidas.length) : undefined"/>
                    </q-tabs>

                    <q-tab-panels v-model="tabVista" animated>

                        <q-tab-panel name="validas" class="q-pa-none">
                            <div v-if="filasValidas.length === 0" class="text-center q-py-lg text-grey-6">
                                <q-icon name="inbox" size="40px"/>
                                <div class="q-mt-sm">No hay filas válidas para importar</div>
                            </div>
                            <q-table v-else
                                :rows="filasValidas" :columns="columnasPreview"
                                row-key="_idx" flat dense
                                :rows-per-page-options="[10, 25, 50]"
                                class="preview-table"
                            >
                                <template v-slot:body-cell-codigo_unspsc="props">
                                    <q-td :props="props" class="text-center">
                                        <span v-if="props.row.codigo_unspsc"
                                            class="text-mono text-caption text-teal-9 bg-teal-1 q-px-xs rounded-borders">
                                            {{ props.row.codigo_unspsc }}
                                        </span>
                                        <span v-else class="text-grey-4">—</span>
                                    </q-td>
                                </template>
                                <template v-slot:body-cell-numero_placa="props">
                                    <q-td :props="props" class="text-center">
                                        <q-badge v-if="props.row.numero_placa"
                                            color="deep-purple-1" text-color="deep-purple-9"
                                            :label="props.row.numero_placa"/>
                                        <span v-else class="text-grey-4">—</span>
                                    </q-td>
                                </template>
                                <template v-slot:body-cell-categoria="props">
                                    <q-td :props="props" class="text-center">
                                        <q-select
                                            v-model="props.row._tipo"
                                            :options="tiposInline"
                                            dense outlined
                                            style="min-width:130px"
                                            color="primary"
                                            behavior="menu"
                                            clearable
                                            :placeholder="destinoForm.tipo_categoria || 'Global'"
                                            hide-bottom-space
                                            @update:model-value="refrescarFilas"
                                        >
                                            <q-tooltip>Categoría individual · vacío usa el global</q-tooltip>
                                        </q-select>
                                    </q-td>
                                </template>

                                <template v-slot:body-cell-destino="props">
                                    <q-td :props="props">
                                        <div class="row items-center q-gutter-xs" style="flex-wrap:nowrap;">
                                            <q-select
                                                v-model="props.row._zonaObj"
                                                :options="editZonas"
                                                option-label="nombre"
                                                option-value="_id"
                                                dense outlined
                                                style="min-width:120px"
                                                :color="modulo === 'materiales' ? 'primary' : 'deep-purple'"
                                                behavior="menu"
                                                clearable
                                                :placeholder="destinoForm.zonaObj ? destinoForm.zonaObj.nombre : 'Global'"
                                                hide-bottom-space
                                                @update:model-value="() => { props.row._aulaObj = null; refrescarFilas(); }"
                                            >
                                                <q-tooltip>Sede individual · vacío usa el global</q-tooltip>
                                            </q-select>
                                            <q-select
                                                v-model="props.row._aulaObj"
                                                :options="aulasPorFila(props.row)"
                                                option-label="nombre"
                                                option-value="_id"
                                                dense outlined
                                                style="min-width:120px"
                                                :color="modulo === 'materiales' ? 'primary' : 'deep-purple'"
                                                behavior="menu"
                                                clearable
                                                :disable="!props.row._zonaObj"
                                                :placeholder="props.row._zonaObj ? 'Ambiente' : (destinoForm.aulaObj ? destinoForm.aulaObj.nombre : 'Global')"
                                                hide-bottom-space
                                                @update:model-value="refrescarFilas"
                                            >
                                                <q-tooltip>Ambiente individual · vacío usa el global</q-tooltip>
                                            </q-select>
                                        </div>
                                    </q-td>
                                </template>

                                <template v-slot:body-cell-cuentadante="props">
                                    <q-td :props="props">
                                        <q-select
                                            v-model="props.row._cuentadanteObj"
                                            :options="editCuentadantes"
                                            option-label="nombre"
                                            option-value="_id"
                                            dense outlined
                                            style="min-width:150px"
                                            :color="modulo === 'materiales' ? 'primary' : 'deep-purple'"
                                            behavior="menu"
                                            clearable
                                            :placeholder="destinoForm.cuentadanteObj ? destinoForm.cuentadanteObj.nombre : 'Global'"
                                            hide-bottom-space
                                            @update:model-value="refrescarFilas"
                                        >
                                            <q-tooltip>Cuentadante individual · vacío usa el global</q-tooltip>
                                            <template v-slot:option="scope">
                                                <q-item v-bind="scope.itemProps">
                                                    <q-item-section>
                                                        <q-item-label>{{ scope.opt.nombre }}</q-item-label>
                                                        <q-item-label caption>CC {{ scope.opt.numero_identificacion }}</q-item-label>
                                                    </q-item-section>
                                                </q-item>
                                            </template>
                                        </q-select>
                                    </q-td>
                                </template>

                                <template v-slot:body-cell-acciones="props">
                                    <q-td :props="props" class="text-center">
                                        <q-btn flat round dense icon="edit" color="primary" size="sm"
                                            @click="abrirEdicion(props.row)">
                                            <q-tooltip>Editar ítem</q-tooltip>
                                        </q-btn>
                                        <q-btn flat round dense icon="delete" color="negative" size="sm"
                                            @click="eliminarFila(props.row._idx)">
                                            <q-tooltip>Quitar del listado</q-tooltip>
                                        </q-btn>
                                    </q-td>
                                </template>
                            </q-table>
                        </q-tab-panel>

                        <q-tab-panel name="errores" class="q-pa-none">
                            <div v-if="filasConError.length === 0" class="text-center q-py-lg text-grey-6">
                                <q-icon name="check_circle" size="40px" color="positive"/>
                                <div class="q-mt-sm text-positive">¡Sin errores!</div>
                            </div>
                            <q-table v-else
                                :rows="filasConError" :columns="columnasError"
                                row-key="_idx" flat dense
                                :rows-per-page-options="[10, 25]"
                                class="preview-table"
                            >
                                <template v-slot:body-cell-errores="props">
                                    <q-td :props="props">
                                        <ul class="q-ma-none q-pl-md" style="font-size:12px;color:#b91c1c;">
                                            <li v-for="(e,i) in props.row._errores" :key="i">{{ e }}</li>
                                        </ul>
                                    </q-td>
                                </template>
                                <template v-slot:body-cell-acciones="props">
                                    <q-td :props="props" class="text-center">
                                        <q-btn flat round dense icon="edit" color="warning" size="sm"
                                            @click="abrirEdicion(props.row)">
                                            <q-tooltip>Editar y corregir</q-tooltip>
                                        </q-btn>
                                        <q-btn flat round dense icon="delete" color="negative" size="sm"
                                            @click="eliminarFila(props.row._idx)">
                                            <q-tooltip>Quitar del listado</q-tooltip>
                                        </q-btn>
                                    </q-td>
                                </template>
                            </q-table>
                        </q-tab-panel>

                        <q-tab-panel name="excluidos" class="q-pa-none">
                            <div v-if="filasExcluidas.length === 0" class="text-center q-py-lg text-grey-6">
                                <q-icon name="check_circle" size="40px" color="positive"/>
                                <div class="q-mt-sm text-positive">¡Ninguna fila excluida!</div>
                            </div>
                            <q-table v-else
                                :rows="filasExcluidas"
                                :columns="columnasExcluidos"
                                row-key="_idx" flat dense
                                :rows-per-page-options="[10, 25]"
                                class="preview-table"
                            >
                                <template v-slot:body-cell-motivo="props">
                                    <q-td :props="props">
                                        <span class="text-caption text-amber-9">{{ props.row._motivo }}</span>
                                    </q-td>
                                </template>
                                <template v-slot:body-cell-acciones_exc="props">
                                    <q-td :props="props" class="text-center">
                                        <q-btn flat round dense icon="edit" color="warning" size="sm"
                                            @click="rescatarExcluido(props.row)">
                                            <q-tooltip>
                                                {{ modulo === 'equipos'
                                                    ? 'Agregar placa SENA y mover a válidos'
                                                    : 'Quitar placa SENA y mover a válidos' }}
                                            </q-tooltip>
                                        </q-btn>
                                    </q-td>
                                </template>
                            </q-table>
                        </q-tab-panel>

                    </q-tab-panels>
                </div>
            </template>

            <q-card-section v-if="paso === 3" style="overflow-y:auto;flex:1;padding:16px;" class="text-center q-py-lg">
                <q-icon :name="(resultado.insertados + resultado.actualizados) > 0 ? 'check_circle' : 'error'"
                    :color="(resultado.insertados + resultado.actualizados) > 0 ? 'positive' : 'negative'" size="64px"/>
                <div class="text-h6 q-mt-md">
                    {{ (resultado.insertados + resultado.actualizados) > 0 ? '¡Importación completada!' : 'Sin registros exitosos' }}
                </div>
                <div class="row justify-center q-col-gutter-md q-mt-md">
                    <div class="col-auto">
                        <div class="resumen-chip resumen-chip--ok" style="min-width:120px">
                            <q-icon name="add_box" size="20px"/>
                            <div><div class="resumen-num">{{ resultado.insertados }}</div><div class="resumen-label">Nuevos</div></div>
                        </div>
                    </div>
                    <div class="col-auto">
                        <div class="resumen-chip resumen-chip--update" style="min-width:120px">
                            <q-icon name="add_circle" size="20px"/>
                            <div><div class="resumen-num">{{ resultado.actualizados }}</div><div class="resumen-label">Entradas (stock sumado)</div></div>
                        </div>
                    </div>
                    <div class="col-auto">
                        <div class="resumen-chip resumen-chip--err" style="min-width:120px">
                            <q-icon name="close" size="20px"/>
                            <div><div class="resumen-num">{{ resultado.fallidos }}</div><div class="resumen-label">Fallidos</div></div>
                        </div>
                    </div>
                </div>
                <div v-if="resultado.actualizados > 0" class="q-mt-md">
                    <q-banner class="bg-teal-1 text-teal-9" rounded dense>
                        <template v-slot:avatar><q-icon name="info" color="teal-8"/></template>
                        <span class="text-caption">
                            <b>{{ resultado.actualizados }} ítem(s)</b> ya existían en el sistema —
                            su stock fue sumado como una <b>entrada</b> automáticamente.
                        </span>
                    </q-banner>
                </div>
                <div v-if="resultado.errores && resultado.errores.length > 0" class="q-mt-lg text-left">
                    <div class="text-subtitle2 text-negative q-mb-sm">Detalle de errores:</div>
                    <q-list bordered separator class="rounded-borders">
                        <q-item v-for="(err,i) in resultado.errores" :key="i" dense>
                            <q-item-section avatar><q-icon name="error" color="negative" size="sm"/></q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-medium">Fila {{ err.fila }}: {{ err.nombre }}</q-item-label>
                                <q-item-label caption class="text-negative">{{ err.errores.join(' · ') }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </div>
            </q-card-section>

            <q-card-actions align="right" style="flex-shrink:0;border-top:1px solid #e0e0e0;padding:10px 16px;">
                <q-btn v-if="paso !== 3" flat label="Cancelar" color="grey" @click="cerrar"/>
                <q-btn v-if="paso === 2" flat label="Volver" color="grey" icon="arrow_back" @click="paso = 1"/>
                <q-btn v-if="paso === 2"
                    unelevated no-caps icon="upload" label="Confirmar e importar"
                    :color="modulo === 'materiales' ? 'primary' : 'deep-purple'"
                    :disable="!todasFilasConDestino || filasValidas.length === 0"
                    :loading="importando"
                    @click="confirmarImportacion"
                />
                <q-btn v-if="paso === 3"
                    unelevated no-caps icon="close" label="Cerrar"
                    :color="modulo === 'materiales' ? 'primary' : 'deep-purple'"
                    @click="cerrar"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>

    <q-dialog v-model="editDialog" persistent style="z-index:7000">
        <q-card style="width:560px; max-width:97vw;">
            <q-toolbar :class="modulo === 'materiales' ? 'bg-primary' : 'bg-green-10'" class="text-white">
                <q-icon name="edit" size="sm" class="q-mr-sm"/>
                <q-toolbar-title class="text-weight-bold">
                    Editar ítem — fila {{ editForm._fila }}
                </q-toolbar-title>
                <q-btn flat round dense icon="close" @click="editDialog = false"/>
            </q-toolbar>

            <q-card-section class="q-gutter-sm q-pt-md" style="max-height:70vh; overflow-y:auto;">

                <q-input
                    :model-value="editForm.codigo_unspsc"
                    @update:model-value="v => editForm.codigo_unspsc = String(v).replace(/\D/g,'').slice(0,8)"
                    @keydown="e => { if (!/^\d$/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'].includes(e.key)) e.preventDefault() }"
                    @paste.prevent="e => { const t=(e.clipboardData||window.clipboardData).getData('text'); editForm.codigo_unspsc=t.replace(/\D/g,'').slice(0,8); }"
                    label="Código UNSPSC (8 dígitos)"
                    outlined dense maxlength="8" inputmode="numeric"
                    hint="Solo números · Ej: 43211503"
                    :rules="[v => !v || /^\d{8}$/.test(v) || 'Debe tener exactamente 8 dígitos']"
                >
                    <template v-slot:prepend><q-icon name="tag" size="xs"/></template>
                    <template v-slot:append>
                        <q-badge v-if="editForm.codigo_unspsc" dense
                            :color="editForm.codigo_unspsc.length === 8 ? 'positive' : 'warning'"
                            :label="editForm.codigo_unspsc.length + '/8'"
                        />
                    </template>
                </q-input>

                <q-input
                    v-model="editForm.nombre"
                    label="Nombre *"
                    outlined dense counter maxlength="150"
                    :rules="[v => !!v || 'El nombre es obligatorio', v => v.length <= 150 || 'Máx. 150 caracteres']"
                >
                    <template v-slot:prepend><q-icon name="label" size="xs"/></template>
                </q-input>

                <q-input
                    v-model="editForm.descripcion"
                    label="Descripción técnica"
                    outlined dense type="textarea" rows="2" maxlength="500"
                    hint="Especificaciones técnicas del ítem (máx. 500 car.)"
                >
                    <template v-slot:prepend><q-icon name="description" size="xs"/></template>
                </q-input>

                <q-input
                    v-if="modulo === 'equipos' || editEsExcluido"
                    v-model="editForm.numero_placa"
                    :label="modulo === 'equipos' ? 'N° Placa SENA *' : 'N° Placa SENA (requerida para equipos)'"
                    outlined dense maxlength="50"
                    :hint="editEsExcluido && modulo === 'materiales'
                        ? 'Este ítem tiene placa y será tratado como Equipo al guardarlo'
                        : 'Identificador único del equipo (Ej: SENA-PC-001)'"
                    :rules="modulo === 'equipos' ? [v => !!v || 'La placa SENA es obligatoria para equipos'] : []"
                >
                    <template v-slot:prepend><q-icon name="qr_code_2" size="xs" color="deep-purple-6"/></template>
                    <template v-slot:append v-if="editEsExcluido && modulo === 'materiales'">
                        <q-btn flat round dense icon="clear" size="xs" color="grey"
                            @click="editForm.numero_placa = ''"
                            title="Borrar placa para tratar como Material"/>
                    </template>
                </q-input>

                <div class="row q-col-gutter-sm">
                    <div class="col-12 col-sm-6">
                        <q-input v-model="editForm.unidad_medida" label="Unidad de medida"
                            outlined dense maxlength="50"
                            hint="Ej: Unidad, Caja, Kit, Par, Metro, Litro">
                            <template v-slot:prepend><q-icon name="straighten" size="xs"/></template>
                        </q-input>
                    </div>
                    <div class="col-12 col-sm-6">
                        <q-input
                            v-if="modulo === 'equipos'"
                            model-value="1"
                            label="Cantidad"
                            outlined dense readonly bg-color="grey-2"
                            hint="Cada equipo es una unidad única (placa SENA)"
                        >
                            <template v-slot:prepend><q-icon name="inventory" size="xs"/></template>
                        </q-input>
                        <q-input
                            v-else
                            v-model.number="editForm.cantidad_total_stock"
                            label="Cantidad *"
                            outlined dense type="number" min="0"
                            :rules="[v => (v !== null && v !== '' && v >= 0) || 'Debe ser un número ≥ 0']"
                        >
                            <template v-slot:prepend><q-icon name="inventory" size="xs"/></template>
                        </q-input>
                    </div>
                </div>

                <q-input v-model="editForm.presentacion" label="Presentación"
                    outlined dense maxlength="300"
                    hint="Ej: Caja x 12, Kit 5 piezas, Maletín completo">
                    <template v-slot:prepend><q-icon name="inventory_2" size="xs"/></template>
                </q-input>

                <div class="q-mt-sm">
                    <div class="text-caption text-grey-7 q-mb-xs">
                        <q-icon name="image" size="xs" class="q-mr-xs"/>Imagen del ítem (opcional)
                    </div>
                    <div v-if="editForm._imagenPreview || editForm.imagen" class="q-mb-sm">
                        <q-img
                            :src="editForm._imagenPreview || editForm.imagen"
                            style="height:110px; width:110px; border-radius:8px; object-fit:cover; border:1px solid #e0e0e0;"
                            fit="cover"
                        >
                            <template v-slot:error>
                                <div class="absolute-full flex flex-center bg-grey-2 text-grey-5 text-caption">Sin imagen</div>
                            </template>
                        </q-img>
                        <q-btn flat dense no-caps size="xs" icon="delete" color="negative" class="q-mt-xs"
                            label="Quitar imagen" @click="quitarImagenEdit"/>
                    </div>
                    <q-card
                        v-else
                        flat bordered
                        class="img-drop-zone q-pa-md text-center cursor-pointer"
                        :class="arrastrandoImagen ? 'img-drop-zone--active' : ''"
                        style="border-radius:8px; border:2px dashed #ccc;"
                        @dragover.prevent="arrastrandoImagen = true"
                        @dragleave="arrastrandoImagen = false"
                        @drop.prevent="onDropImagen"
                        @click="$refs.imgInput.click()"
                    >
                        <q-icon name="add_photo_alternate" size="28px" color="grey-5"/>
                        <div class="text-caption text-grey-5 q-mt-xs">Arrastra o haz clic · JPG, PNG, WEBP · máx. 2 MB</div>
                        <input ref="imgInput" type="file" accept="image/jpeg,image/png,image/webp"
                            style="display:none" @change="onImagenSeleccionada"/>
                    </q-card>
                </div>

                <q-banner v-if="editDuplicadoAlerta" class="bg-orange-1 text-orange-9" rounded dense>
                    <template v-slot:avatar><q-icon name="warning" color="orange-8"/></template>
                    Ya existe otra fila con el mismo nombre en este listado.
                </q-banner>

            </q-card-section>

            <q-card-actions align="right" class="q-px-md q-pb-md">
                <q-btn flat label="Cancelar" color="grey" @click="editDialog = false"/>
                <q-btn
                    unelevated no-caps icon="save" label="Guardar cambios"
                    :color="modulo === 'materiales' ? 'primary' : 'deep-purple'"
                    :disable="!canSaveEdit"
                    @click="guardarEdicion"
                >
                    <q-tooltip v-if="!canSaveEdit">Completa los campos obligatorios para guardar</q-tooltip>
                </q-btn>
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import * as XLSX from 'xlsx';
import { itemsService, zonesService, classroomsService, cuentadantesService } from '.././services/items.js';

const props = defineProps({
    modulo: { type: String, required: true, validator: v => ['materiales', 'equipos'].includes(v) }
});
const emit = defineEmits(['importado']);
const $q = useQuasar();

const dialogVisible       = ref(false);
const paso                = ref(1);
const arrastrandoArchivo  = ref(false);
const archivoSeleccionado = ref(null);
const procesando          = ref(false);
const importando          = ref(false);
const generandoPlantilla  = ref(false);
const cargandoUbicaciones = ref(false);
const tabVista            = ref('validas');
const filasExcluidas      = ref([]);
const filas               = ref([]);
const resultado           = ref({ insertados: 0, actualizados: 0, fallidos: 0, errores: [] });

const editDialog        = ref(false);
const editForm          = ref({});
const editIdxOriginal   = ref(null);
const arrastrandoImagen = ref(false);
const editEsExcluido    = ref(false);

const editZonas = ref([]);
const editAulas = ref([]);
const editCuentadantes = ref([]);

const aulasFiltradas = computed(() =>
    destinoForm.value.zonaObj
        ? editAulas.value.filter(a => String(a.zona?._id || a.zona) === String(destinoForm.value.zonaObj._id))
        : editAulas.value
);

const aulasPorFila = (fila) => {
    if (!fila._zonaObj) return editAulas.value;
    return editAulas.value.filter(a => String(a.zona?._id || a.zona) === String(fila._zonaObj._id));
};

const tiposInline = computed(() =>
    props.modulo === 'materiales' ? ['Consumible', 'De Uso Controlado'] : ['Equipo O Maquinaria']
);

const destinoForm = ref({ tipo_categoria: null, zonaObj: null, aulaObj: null, cuentadanteObj: null });

const destinoListo = computed(() => {
    const hayFilaSinDestinoPropio = filasValidas.value.some(f => !f._zonaObj || !f._aulaObj);
    if (!hayFilaSinDestinoPropio) return true;
    const g = destinoForm.value;
    const tipoOk = props.modulo === 'equipos' || !!g.tipo_categoria;
    return tipoOk && !!g.zonaObj && !!g.aulaObj;
});

const todasFilasConDestino = computed(() => {
    return filasValidas.value.every(f => {
        const zonaOk = !!(f._zonaObj || destinoForm.value.zonaObj);
        const aulaOk = !!(f._aulaObj || destinoForm.value.aulaObj);
        const tipoOk = props.modulo === 'equipos' || !!(f._tipo || destinoForm.value.tipo_categoria);
        const cuentadanteOk = !!(f._cuentadanteObj || destinoForm.value.cuentadanteObj);
        return zonaOk && aulaOk && tipoOk && cuentadanteOk;
    });
});

const tiposPermitidos = computed(() =>
    props.modulo === 'materiales' ? ['Consumible', 'De Uso Controlado'] : ['Equipo O Maquinaria']
);

const filasValidas  = computed(() => filas.value.filter(f => f._valida));
const filasConError = computed(() => filas.value.filter(f => !f._valida));

const columnasPreview = computed(() => {
    const cols = [
        { name: 'fila',                 label: '#',               align: 'center', field: '_fila',                sortable: true,  style: 'width:46px' },
        { name: 'nombre',               label: 'Nombre',          align: 'left',   field: 'nombre',               sortable: true,  style: 'min-width:180px' },
        { name: 'codigo_unspsc',        label: 'UNSPSC',          align: 'center', field: 'codigo_unspsc',        sortable: false, style: 'width:90px' },
        { name: 'unidad_medida',        label: 'Unidad',          align: 'left',   field: 'unidad_medida',        sortable: false, style: 'width:80px' },
        { name: 'cantidad_total_stock', label: 'Cantidad',        align: 'center', field: 'cantidad_total_stock', sortable: true,  style: 'width:78px' },
        { name: 'categoria',            label: 'Categoría',       align: 'center', field: '_tipo',                sortable: false, style: 'width:130px' },
        { name: 'destino',              label: 'Sede / Ambiente', align: 'left',   field: '_zonaObj',             sortable: false, style: 'min-width:220px' },
        { name: 'cuentadante',          label: 'Cuentadante',     align: 'left',   field: '_cuentadanteObj',      sortable: false, style: 'min-width:160px' },
        { name: 'acciones',             label: '',                align: 'center', field: 'acciones',                              style: 'width:80px' },
    ];
    if (props.modulo === 'equipos') {
        cols.splice(3, 0, {
            name: 'numero_placa', label: 'Placa SENA', align: 'center', field: 'numero_placa', sortable: true, style: 'width:115px'
        });
        const idx = cols.findIndex(c => c.name === 'categoria');
        if (idx !== -1) cols.splice(idx, 1);
    }
    return cols;
});

const columnasError = [
    { name: 'fila',     label: 'Fila',    align: 'center', field: '_fila',    style: 'width:54px' },
    { name: 'nombre',   label: 'Nombre',  align: 'left',   field: 'nombre',   sortable: true },
    { name: 'errores',  label: 'Errores', align: 'left',   field: '_errores' },
    { name: 'acciones', label: '',        align: 'center', field: 'acciones', style: 'width:80px' },
];

const columnasExcluidos = [
    { name: 'fila',          label: 'Fila',   align: 'center', field: '_fila',  style: 'width:54px' },
    { name: 'nombre',        label: 'Nombre', align: 'left',   field: 'nombre', sortable: true },
    { name: 'motivo',        label: 'Motivo de exclusión', align: 'left', field: '_motivo' },
    { name: 'acciones_exc',  label: '',       align: 'center', field: 'acciones_exc', style: 'width:56px' },
];

const columnasEsperadas = computed(() => {
    const base = [
        { campo: 'codigo_unspsc',        obligatorio: false, descripcion: 'Código UNSPSC de 8 dígitos. Ej: 43211503' },
        { campo: 'nombre',               obligatorio: true,  descripcion: 'Nombre/Descripción General del ítem (máx 150 car.)' },
        { campo: 'descripcion',          obligatorio: false, descripcion: 'Descripción técnica (máx 500 car.)' },
        { campo: 'unidad_medida',        obligatorio: false, descripcion: 'Ej: Unidad, Par, Caja, Kit, Metro, Litro, Resma' },
        { campo: 'presentacion',         obligatorio: false, descripcion: 'Ej: Caja x 12, Kit 5 piezas, Maletín completo' },
        { campo: 'cantidad_total_stock', obligatorio: true,  descripcion: 'Número entero ≥ 0' },
    ];
    if (props.modulo === 'equipos') {
        base.splice(3, 0, { campo: 'numero_placa', obligatorio: true, descripcion: 'Placa SENA única grabada en el equipo. Su presencia identifica el ítem como equipo.' });
    }
    return base;
});

const formatBytes = (b) => b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB';

const abrirDialog = () => {
    paso.value = 1;
    limpiarArchivo();
    destinoForm.value = { tipo_categoria: null, zonaObj: null, aulaObj: null, cuentadanteObj: null };
    dialogVisible.value = true;
};

const cerrar = () => {
    dialogVisible.value = false;
    if (paso.value === 3 && resultado.value.insertados > 0) emit('importado');
};

const limpiarArchivo = () => {
    archivoSeleccionado.value = null;
    filas.value = [];
    filasExcluidas.value = [];
    tabVista.value = 'validas';
};

const onFileSelected = (e) => { if (e.target.files[0]) validarYAsignarArchivo(e.target.files[0]); e.target.value = ''; };
const onDrop = (e) => { arrastrandoArchivo.value = false; if (e.dataTransfer.files[0]) validarYAsignarArchivo(e.dataTransfer.files[0]); };

const validarYAsignarArchivo = (file) => {
    if (!['xlsx','xls'].includes(file.name.split('.').pop().toLowerCase())) {
        $q.notify({ type: 'warning', message: 'Solo se aceptan archivos .xlsx o .xls', position: 'top', timeout: 3000 }); return;
    }
    if (file.size > 10*1024*1024) {
        $q.notify({ type: 'warning', message: 'El archivo no debe superar 10 MB', position: 'top', timeout: 3000 }); return;
    }
    archivoSeleccionado.value = file;
};

const procesarArchivo = async () => {
    if (!archivoSeleccionado.value) return;
    procesando.value = true;
    try {
        const buffer = await archivoSeleccionado.value.arrayBuffer();
        const [zData, aData, cData] = await Promise.all([zonesService.getAll(), classroomsService.getAll(), cuentadantesService.getAll()]);
        editZonas.value = zData;
        editAulas.value = aData;
        editCuentadantes.value = cData;

        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawRows.length === 0) {
            $q.notify({ type: 'warning', message: 'El archivo está vacío', position: 'top', timeout: 3000 });
            return;
        }
        if (rawRows.length > 500) {
            $q.notify({ type: 'warning', message: 'El archivo supera el límite de 500 ítems', position: 'top', timeout: 4000 });
            return;
        }

        const excluidas = [];
        const placasEnLote = new Set();
        const filasParseadas = [];

        rawRows.forEach((raw, idx) => {
            const placa      = String(raw.numero_placa || raw['Numero Placa'] || raw['N° Placa'] || raw['numero placa'] || '').trim().toUpperCase();
            const tienePlaca = placa.length > 0;
            const nombreRaw  = String(raw.nombre || raw['Nombre'] || raw['NOMBRE'] || '').trim();

            if (props.modulo === 'materiales' && tienePlaca) {
                excluidas.push({ _idx: idx, _fila: idx + 2, nombre: nombreRaw || `Fila ${idx+2}`, imagen: '', _motivo: 'Tiene número de placa SENA → pertenece al módulo de Equipos y Maquinaria' });
                return;
            }
            if (props.modulo === 'equipos' && !tienePlaca) {
                excluidas.push({ _idx: idx, _fila: idx + 2, nombre: nombreRaw || `Fila ${idx+2}`, imagen: '', _motivo: 'Sin número de placa SENA → pertenece al módulo de Materiales' });
                return;
            }

            const nombre   = String(raw.nombre || raw['Nombre'] || raw['NOMBRE'] || '').trim();
            const cantRaw  = String(raw.cantidad_total_stock ?? raw['Cantidad'] ?? '').trim();
            const cantidad = parseInt(cantRaw, 10);
            const unspsc   = String(raw.codigo_unspsc || raw['Codigo UNSPSC'] || raw['Código UNSPSC'] || '').trim().replace(/\D/g,'').slice(0,8);

            const errores = [];
            if (!nombre)             errores.push('nombre es obligatorio');
            if (nombre.length > 150) errores.push('nombre supera 150 caracteres');
            if (props.modulo !== 'equipos' && (cantRaw === '' || isNaN(cantidad) || cantidad < 0))
                errores.push('cantidad_total_stock debe ser un número ≥ 0');
            if (unspsc && !/^\d{8}$/.test(unspsc))
                errores.push('codigo_unspsc debe tener exactamente 8 dígitos');
            if (props.modulo === 'equipos') {
                if (placasEnLote.has(placa)) errores.push(`Placa "${placa}" duplicada en el archivo`);
                else placasEnLote.add(placa);
            }

            filasParseadas.push({
                _idx:                 idx,
                _fila:                idx + 2,
                _valida:              errores.length === 0,
                _errores:             errores,
                _tipo:           null,
                _zonaObj:        null,
                _aulaObj:        null,
                _cuentadanteObj: null,
                imagen:               '',
                codigo_unspsc:        unspsc,
                nombre,
                descripcion:          String(raw.descripcion || raw['Descripcion'] || raw['Descripción'] || '').trim(),
                numero_placa:         placa,
                unidad_medida:        String(raw.unidad_medida || raw['Unidad de Medida'] || '').trim(),
                presentacion:         String(raw.presentacion || raw['Presentacion'] || raw['Presentación'] || '').trim(),
                cantidad_total_stock: props.modulo === 'equipos' ? 1 : (isNaN(cantidad) ? '' : cantidad),
            });
        });

        filas.value = filasParseadas;
        filasExcluidas.value = excluidas;

        if (filasParseadas.length === 0) {
            $q.notify({
                type: 'warning',
                multiLine: true,
                message: excluidas.length > 0
                    ? (props.modulo === 'materiales'
                        ? `Todas las filas tienen placa SENA y corresponden al módulo de Equipos. Usa "Importar Excel" desde Gestión de Equipos.`
                        : `Ninguna fila tiene placa SENA. Estos ítems corresponden al módulo de Materiales.`)
                    : 'No se encontraron filas con datos en el archivo.',
                position: 'top', timeout: 7000
            });
            return;
        }

        if (props.modulo === 'equipos') destinoForm.value.tipo_categoria = 'Equipo O Maquinaria';
        tabVista.value = filasParseadas.some(f => f._valida) ? 'validas' : 'errores';
        paso.value = 2;

    } catch (err) {
        console.error('Error procesando Excel:', err);
        $q.notify({ type: 'negative', message: 'No se pudo leer el archivo. Verifica que sea un Excel válido.', position: 'top', timeout: 4000 });
    } finally {
        procesando.value = false;
    }
};

const editDuplicadoAlerta = computed(() => {
    if (!editForm.value.nombre) return false;
    const nombre = editForm.value.nombre.trim().toLowerCase();
    return filas.value.some((f, i) => {
        if (i === editIdxOriginal.value) return false;
        return (f.nombre || '').trim().toLowerCase() === nombre;
    });
});

const canSaveEdit = computed(() => {
    const f = editForm.value;
    const nombreOk  = !!(f.nombre?.trim().length >= 3);
    const unspscOk  = !f.codigo_unspsc || /^\d{8}$/.test(f.codigo_unspsc);
    const esEfectivamenteEquipo = props.modulo === 'equipos' || (editEsExcluido.value && !!f.numero_placa?.trim());
    const placaOk = !esEfectivamenteEquipo || !!(f.numero_placa?.trim());
    const cantOk  = esEfectivamenteEquipo
        ? true
        : (f.cantidad_total_stock !== '' && f.cantidad_total_stock !== null && !isNaN(Number(f.cantidad_total_stock)) && Number(f.cantidad_total_stock) >= 0);
    return nombreOk && unspscOk && placaOk && cantOk;
});

const abrirEdicion = (fila) => {
    editIdxOriginal.value = filas.value.findIndex(f => f._idx === fila._idx);
    editEsExcluido.value = false;
    // Inicializar siempre imagen:'', _imagenPreview y _imagenFile para que Vue
    // los trackee como propiedades reactivas propias desde el inicio.
    editForm.value = {
        imagen: '',
        ...fila,
        _imagenPreview: fila.imagen || null,
        _imagenFile: null,
    };
    editDialog.value = true;
};

const revalidarFila = (fila) => {
    if (props.modulo === 'equipos') fila.cantidad_total_stock = 1;

    const errores = [];
    if (!fila.nombre)              errores.push('nombre es obligatorio');
    if (fila.nombre?.length > 150) errores.push('nombre supera 150 caracteres');

    if (props.modulo !== 'equipos') {
        const cant = Number(fila.cantidad_total_stock);
        if (fila.cantidad_total_stock === '' || isNaN(cant) || cant < 0)
            errores.push('cantidad_total_stock debe ser un número ≥ 0');
    }

    if (fila.codigo_unspsc && !/^\d{8}$/.test(fila.codigo_unspsc))
        errores.push('codigo_unspsc debe tener exactamente 8 dígitos');

    if (props.modulo === 'equipos') {
        if (!fila.numero_placa) errores.push('numero_placa es obligatorio para equipos');
        else {
            const placaDup = filas.value.some((f, i) =>
                i !== editIdxOriginal.value &&
                f.numero_placa && f.numero_placa === fila.numero_placa
            );
            if (placaDup) errores.push(`Placa "${fila.numero_placa}" duplicada en el archivo`);
        }
    }
    fila._errores = errores;
    fila._valida  = errores.length === 0;
};

// FIX: Convertido a async/await con FileReader envuelto en Promise para garantizar
// que _imagenPreview siempre esté listo antes de que la función retorne.
// Esto evita que guardarEdicion se ejecute antes de que la lectura del archivo termine.
const onImagenSeleccionada = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        $q.notify({ type: 'warning', message: 'La imagen no debe superar 2 MB', position: 'top', timeout: 3000 });
        return;
    }
    const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = (ev) => resolve(ev.target.result);
        reader.onerror = () => reject(new Error('Error al leer la imagen'));
        reader.readAsDataURL(file);
    });
    editForm.value._imagenPreview = base64;
    editForm.value._imagenFile    = file;
    if (e.target) e.target.value = '';
};

// FIX: await necesario porque onImagenSeleccionada ahora es async
const onDropImagen = async (e) => {
    arrastrandoImagen.value = false;
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const ev2 = { target: { files: [file], value: '' } };
    await onImagenSeleccionada(ev2);
};

const quitarImagenEdit = () => {
    editForm.value._imagenPreview = null;
    editForm.value._imagenFile = null;
    editForm.value.imagen = '';
};

const guardarEdicion = () => {
    if (editIdxOriginal.value === null) return;

    if (editForm.value.numero_placa) {
        editForm.value.numero_placa = editForm.value.numero_placa.trim().toUpperCase();
    }
    if (editForm.value.codigo_unspsc) {
        editForm.value.codigo_unspsc = editForm.value.codigo_unspsc.replace(/\D/g, '').slice(0, 8);
    }

    // Persistir la imagen base64 en el campo imagen de la fila.
    // Si hay preview lo usamos; si no hay, dejamos lo que ya tenía imagen
    // (podría ser base64 de edición anterior) o string vacío si fue quitada.
    const imagenFinal = editForm.value._imagenPreview || editForm.value.imagen || '';

    const filaActualizada = {
        ...editForm.value,
        imagen: imagenFinal,
    };

    delete filaActualizada._imagenFile;
    delete filaActualizada._imagenPreview;

    revalidarFila(filaActualizada);

    if (editEsExcluido.value) {
        filasExcluidas.value = filasExcluidas.value.filter(f => f._idx !== filaActualizada._idx);
        filaActualizada._idx = Date.now();
        filas.value = [...filas.value, filaActualizada];
    } else {
        filas.value[editIdxOriginal.value] = filaActualizada;
        filas.value = [...filas.value];
    }

    editDialog.value = false;
    editIdxOriginal.value = null;
    editEsExcluido.value = false;

    $q.notify({
        type: filaActualizada._valida ? 'positive' : 'warning',
        message: filaActualizada._valida
            ? 'Ítem guardado correctamente'
            : 'Ítem guardado pero aún tiene errores',
        position: 'top', timeout: 2500
    });
};

const rescatarExcluido = (fila) => {
    editIdxOriginal.value = null;
    editEsExcluido.value = true;
    editForm.value = {
        imagen: '',
        ...fila,
        _imagenPreview: fila.imagen || null,
        _imagenFile: null,
        _errores: [],
        _valida: false,
    };
    editDialog.value = true;
};

const onGlobalTipoChange = (val) => {
    filas.value.forEach(f => { if (!f._tipo) f._tipo = val; });
    refrescarFilas();
};
const onGlobalZonaChange = (val) => {
    destinoForm.value.aulaObj = null;
    filas.value.forEach(f => { if (!f._zonaObj) { f._zonaObj = val; f._aulaObj = null; } });
    refrescarFilas();
};
const onGlobalAulaChange = (val) => {
    filas.value.forEach(f => { if (!f._aulaObj && f._zonaObj?._id === destinoForm.value.zonaObj?._id) f._aulaObj = val; });
    refrescarFilas();
};

const onGlobalCuentadanteChange = (val) => {
    filas.value.forEach(f => { if (!f._cuentadanteObj) f._cuentadanteObj = val; });
    refrescarFilas();
};

const refrescarFilas = () => { filas.value = [...filas.value]; };

const eliminarFila = (idx) => {
    filas.value = filas.value.filter(f => f._idx !== idx);
    $q.notify({ type: 'info', message: 'Fila eliminada del listado', position: 'top', timeout: 1800 });
};

const confirmarImportacion = async () => {
    if (filasValidas.value.length === 0 || !todasFilasConDestino.value) return;
    importando.value = true;
    const tipoCategoria = props.modulo === 'equipos' ? 'Equipo O Maquinaria' : destinoForm.value.tipo_categoria;
    try {
        const payload = filasValidas.value.map(f => {
            const rowTipo = (props.modulo === 'equipos')
                ? 'Equipo O Maquinaria'
                : (f._tipo || destinoForm.value.tipo_categoria);
            const zonaName = f._zonaObj ? f._zonaObj.nombre : destinoForm.value.zonaObj?.nombre;
            const aulaName = f._aulaObj ? f._aulaObj.nombre : destinoForm.value.aulaObj?.nombre;
            const cuentadanteId = (f._cuentadanteObj?._id) || (destinoForm.value.cuentadanteObj?._id);
            return {
                codigo_unspsc:        f.codigo_unspsc   || undefined,
                nombre:               f.nombre,
                descripcion:          f.descripcion     || undefined,
                tipo_categoria:       rowTipo,
                numero_placa:         f.numero_placa    || undefined,
                unidad_medida:        f.unidad_medida   || undefined,
                presentacion:         f.presentacion    || undefined,
                cantidad_total_stock: f.cantidad_total_stock,
                imagen:               f.imagen          || undefined,
                zona:                 zonaName,
                aula:                 aulaName,
                cuentadante:          cuentadanteId,
            };
        });
        resultado.value = await itemsService.bulkCreate(payload);
        paso.value = 3;
        const total = (resultado.value.insertados || 0) + (resultado.value.actualizados || 0);
        if (total > 0) {
            const partes = [];
            if (resultado.value.insertados > 0) partes.push(`${resultado.value.insertados} nuevo(s)`);
            if (resultado.value.actualizados > 0) partes.push(`${resultado.value.actualizados} entrada(s) de stock`);
            $q.notify({ type: 'positive', message: `Importación completada: ${partes.join(' · ')}`, position: 'top', icon: 'check_circle', timeout: 4000 });
        }
        if (total > 0) emit('importado');
    } catch (err) {
        console.error('Error importación masiva:', err);
        $q.notify({ type: 'negative', message: err.response?.data?.message || 'Error al importar los ítems', position: 'top', timeout: 4000 });
    } finally {
        importando.value = false;
    }
};

const descargarPlantilla = async () => {
    generandoPlantilla.value = true;
    try {
        const ENCABEZADOS = props.modulo === 'equipos'
            ? ['codigo_unspsc','nombre','descripcion','numero_placa','unidad_medida','presentacion','cantidad_total_stock']
            : ['codigo_unspsc','nombre','descripcion','unidad_medida','presentacion','cantidad_total_stock'];

        const filaEjemplo1 = props.modulo === 'equipos'
            ? { codigo_unspsc:'12345678', nombre:'Ítem de ejemplo', descripcion:'Descripción técnica de ejemplo', numero_placa:'SENA-EJ-001', unidad_medida:'Unidad', presentacion:'Unidad completa', cantidad_total_stock:1 }
            : { codigo_unspsc:'12345678', nombre:'Ítem de ejemplo', descripcion:'Descripción técnica de ejemplo', unidad_medida:'Unidad', presentacion:'Caja x 1', cantidad_total_stock:10 };

        const ws = XLSX.utils.json_to_sheet([filaEjemplo1], { header: ENCABEZADOS });
        ws['!cols'] = ENCABEZADOS.map(h => ({ wch: ['nombre','descripcion'].includes(h) ? 42 : h==='presentacion' ? 30 : 18 }));

        const guia = [
            ['GUIA DE DILIGENCIAMIENTO'],[''],
            ['IMPORTANTE: Categoría, sede y ambiente se seleccionan en el panel al importar. NO van en el Excel.'],[''],
            ['Columna','Obligatorio','Descripción','Ejemplo'],
            ['codigo_unspsc','No','8 dígitos del catálogo UNSPSC', props.modulo==='materiales'?'44111905':'43211902'],
            ['nombre','SÍ','Nombre del ítem (máx 150 car.)', props.modulo==='materiales'?'Marcadores borrables':'Computador HP EliteDesk'],
            ['descripcion','No','Descripción técnica (máx 500 car.)', props.modulo==='materiales'?'Caja x12, colores surtidos':'Intel Core i7, 16GB RAM'],
            ...(props.modulo==='equipos'?[['numero_placa','SÍ','Placa SENA única grabada en el equipo. Su PRESENCIA identifica el ítem como equipo.','SENA-PC-001']]:
                [['(numero_placa)','—','NO incluir para materiales. Ítems con placa serán ignorados al importar en este módulo.','—']]),
            ['unidad_medida','No','Unidad de medida', props.modulo==='materiales'?'Caja':'Unidad'],
            ['presentacion','No','Presentación / empaque (máx 300 car.)', props.modulo==='materiales'?'Caja x 12 unidades':'Equipo completo'],
            ['cantidad_total_stock','SÍ','Número entero ≥ 0', props.modulo==='materiales'?'50':'1'],
        ];
        const wsGuia = XLSX.utils.aoa_to_sheet(guia);
        wsGuia['!cols'] = [{ wch:22 },{ wch:12 },{ wch:60 },{ wch:36 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Importar Items');
        XLSX.utils.book_append_sheet(wb, wsGuia, 'Guía');
        XLSX.writeFile(wb, `plantilla_${props.modulo}.xlsx`);
        $q.notify({ type:'positive', message:'Plantilla descargada', position:'top', icon:'download', timeout:2500 });
    } catch(err) {
        console.error(err);
        $q.notify({ type:'negative', message:'Error al generar la plantilla', position:'top', timeout:3000 });
    } finally {
        generandoPlantilla.value = false;
    }
};
</script>

<style scoped>
.action-btn { border-radius: 8px !important; }

.destino-bar {
    background: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
}

.drag-zone {
    border: 2px dashed #ccc;
    border-radius: 12px;
    transition: all .2s;
    background: #f7fbf2;
}
.drag-zone:hover, .drag-zone--active {
    border-color: #1a4f00;
    background: rgba(57,169,0,.04);
}

.resumen-chip {
    border-radius: 10px; padding: 12px 16px;
    display: flex; align-items: center; gap: 10px;
    border: 2px solid transparent;
}
.resumen-chip--ok     { background:#f0fdf4; color:#39A900; border-color:#d4f0b0; }
.resumen-chip--update { background:#f0fdfa; color:#0d9488; border-color:#99f6e4; }
.resumen-chip--err    { background:#fef2f2; color:#dc2626; border-color:#fecaca; }
.resumen-num   { font-size:22px; font-weight:700; line-height:1; }
.resumen-label { font-size:11px; font-weight:500; opacity:.8; }

.preview-table :deep(thead tr th) {
    background: #f0f0f0 !important;
    color: #616161 !important;
    font-weight: 600 !important;
    font-size: 11px !important;
    text-transform: uppercase !important;
}
</style>