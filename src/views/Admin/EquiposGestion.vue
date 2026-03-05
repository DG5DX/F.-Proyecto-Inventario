<template>
    <q-page class="page-bg q-pa-md q-pa-sm-xs">

        <!-- ── Header ──────────────────────────────────────────────── -->
        <div class="page-header row items-center q-mb-md q-gutter-sm">
            <div class="row items-center col-12 col-sm-auto">
                <q-btn
                    icon="arrow_back"
                    flat round dense
                    color="primary"
                    @click="router.push({ name: 'admin.classrooms' })"
                    class="q-mr-xs"
                >
                    <q-tooltip>Volver a Ambientes</q-tooltip>
                </q-btn>
                <div class="header-icon-wrap q-mr-sm">
                    <q-icon name="precision_manufacturing" size="20px" color="white"/>
                </div>
                <div>
                    <div class="text-h6 text-weight-bold text-dark lh-tight">Gestión de Equipos y Maquinaria</div>
                    <div class="text-caption text-grey-6">Inventario devolutivo — equipos con número de placa SENA</div>
                </div>
            </div>
            <q-space class="gt-xs"/>
            <q-btn
                outline color="primary"
                icon="refresh"
                label="Actualizar"
                dense no-caps
                @click="loadItems"
                :loading="loading"
                class="action-btn"
            />
        </div>

        <!-- ── Stat chips ───────────────────────────────────────────── -->
        <div v-if="items.length > 0" class="row q-col-gutter-sm q-mb-md">
            <div class="col-4">
                <div class="stat-chip stat-chip--blue">
                    <q-icon name="precision_manufacturing" size="18px"/>
                    <div>
                        <div class="stat-number">{{ filteredItems.length }}</div>
                        <div class="stat-label">Total</div>
                    </div>
                </div>
            </div>
            <div class="col-4">
                <div class="stat-chip stat-chip--green">
                    <q-icon name="check_circle" size="18px"/>
                    <div>
                        <div class="stat-number">{{ disponiblesCount }}</div>
                        <div class="stat-label">Disponibles</div>
                    </div>
                </div>
            </div>
            <div class="col-4">
                <div class="stat-chip stat-chip--red">
                    <q-icon name="cancel" size="18px"/>
                    <div>
                        <div class="stat-number">{{ agotadosCount }}</div>
                        <div class="stat-label">Agotados</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Filter card ──────────────────────────────────────────── -->
        <q-card flat class="filter-card q-mb-md">
            <q-card-section class="q-py-sm">
                <div class="row q-col-gutter-sm">
                    <div class="col-12 col-sm-4">
                        <q-select
                            v-model="zonaFiltro"
                            :options="zonas"
                            option-value="_id"
                            option-label="nombre"
                            emit-value map-options
                            label="Filtrar por Sede"
                            outlined dense clearable
                            bg-color="white"
                            @update:model-value="aulaFiltro = null"
                        >
                            <template v-slot:prepend><q-icon name="category" color="primary"/></template>
                        </q-select>
                    </div>
                    <div class="col-12 col-sm-4">
                        <q-select
                            v-model="aulaFiltro"
                            :options="aulasFiltroOptions"
                            option-value="_id"
                            option-label="nombre"
                            emit-value map-options
                            label="Filtrar por Ambiente"
                            outlined dense clearable
                            bg-color="white"
                            :disable="!zonaFiltro"
                            :hint="!zonaFiltro ? 'Selecciona una sede primero' : ''"
                        >
                            <template v-slot:prepend><q-icon name="meeting_room" color="primary"/></template>
                        </q-select>
                    </div>
                    <div class="col-12 col-sm-4">
                        <q-input
                            v-model="searchQuery"
                            label="Buscar por nombre o placa"
                            outlined dense clearable
                            bg-color="white"
                        >
                            <template v-slot:prepend><q-icon name="search" color="primary"/></template>
                        </q-input>
                    </div>
                </div>
            </q-card-section>
        </q-card>

        <!-- ── Loading / Error ──────────────────────────────────────── -->
        <div v-if="loading && !items.length" class="text-center q-py-xl">
            <q-spinner-dots size="56px" color="primary"/>
            <div class="text-body2 text-grey-6 q-mt-md">Cargando equipos y maquinaria...</div>
        </div>

        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="56px" color="negative" class="q-mb-md"/>
            <div class="text-body1 text-negative">{{ error }}</div>
            <q-btn color="primary" label="Reintentar" @click="loadItems" class="q-mt-md" unelevated/>
        </div>

        <!-- ── Table card ────────────────────────────────────────────── -->
        <q-card v-else class="table-card" flat>
            <q-table
                :rows="filteredItems"
                :columns="itemColumns"
                row-key="_id"
                flat
                :rows-per-page-options="[10, 25, 50, 0]"
                no-data-label="No hay equipos o maquinaria para mostrar"
                class="items-table"
            >
                <template v-slot:top>
                    <div class="row full-width items-center q-px-sm q-py-sm q-gutter-sm">
                        <div class="text-subtitle2 text-weight-bold text-dark col-auto">
                            Listado de equipos y maquinaria
                            <q-badge v-if="filteredItems.length" color="primary" class="q-ml-xs" :label="filteredItems.length"/>
                        </div>
                        <q-space/>
                        <q-btn
                            color="primary"
                            icon="add"
                            label="Añadir Equipo"
                            unelevated dense no-caps
                            @click="openCreateDialog"
                            style="border-radius:8px;"
                        />
                    </div>
                </template>

                <!-- Nombre con imagen -->
                <template v-slot:body-cell-nombre="props">
                    <q-td :props="props">
                        <div class="row no-wrap items-center" style="gap:10px;">
                            <div class="item-img-wrap">
                                <q-img
                                    v-if="props.row.imagen"
                                    :src="props.row.imagen"
                                    fit="cover"
                                    class="item-img"
                                    spinner-size="18px"
                                    spinner-color="primary"
                                >
                                    <template v-slot:error>
                                        <div class="item-img-fallback">
                                            <q-icon name="precision_manufacturing" size="18px" color="grey-5"/>
                                        </div>
                                    </template>
                                </q-img>
                                <div v-else class="item-img-fallback">
                                    <q-icon name="precision_manufacturing" size="18px" color="grey-5"/>
                                </div>
                                <!-- dot de estado sobre imagen -->
                                <span class="item-status-dot" :class="props.row.estado === 'Disponible' ? 'item-status-dot--green' : 'item-status-dot--red'"/>
                            </div>
                            <div>
                                <div class="text-weight-semibold cell-primary">{{ props.row.nombre }}</div>
                                <div v-if="props.row.descripcion" class="cell-secondary desc-clamp">{{ props.row.descripcion }}</div>
                            </div>
                        </div>
                    </q-td>
                </template>

                <!-- Placa SENA -->
                <template v-slot:body-cell-placa="props">
                    <q-td :props="props">
                        <div v-if="props.row.numero_placa" class="placa-wrap">
                            <q-icon name="qr_code_2" size="13px" class="q-mr-xs text-orange-8"/>
                            <span class="placa-text">{{ props.row.numero_placa }}</span>
                        </div>
                        <span v-else class="cell-secondary text-italic">Sin placa</span>
                    </q-td>
                </template>

                <template v-slot:body-cell-ubicacion="props">
                    <q-td :props="props">
                        <div class="cell-primary">
                            <q-icon name="category" size="12px" class="q-mr-xs text-primary"/>{{ props.row.zona?.nombre || '—' }}
                        </div>
                        <div class="cell-secondary">
                            <q-icon name="meeting_room" size="11px" class="q-mr-xs"/>{{ props.row.aula?.nombre || '—' }}
                        </div>
                    </q-td>
                </template>

                <template v-slot:body-cell-stock="props">
                    <q-td :props="props">
                        <div class="stock-display">
                            <span class="stock-available" :class="getStockColorClass(props.row)">{{ props.row.cantidad_disponible }}</span>
                            <span class="stock-sep">/</span>
                            <span class="stock-total">{{ props.row.cantidad_total_stock }}</span>
                        </div>
                        <q-linear-progress
                            :value="props.row.cantidad_total_stock > 0 ? props.row.cantidad_disponible / props.row.cantidad_total_stock : 0"
                            :color="getStockColor(props.row)"
                            size="5px"
                            class="q-mt-xs stock-bar"
                        />
                    </q-td>
                </template>

                <template v-slot:body-cell-estado="props">
                    <q-td :props="props" class="text-center">
                        <span class="status-badge" :class="props.row.estado === 'Disponible' ? 'status-badge--disponible' : 'status-badge--agotado'">
                            {{ props.row.estado }}
                        </span>
                    </q-td>
                </template>

                <template v-slot:body-cell-acciones="props">
                    <q-td :props="props">
                        <div class="row no-wrap justify-center" style="gap:2px;">
                            <q-btn icon="tune" color="primary" size="sm" round flat dense @click="openAjusteDialog(props.row)">
                                <q-tooltip>Ajustar stock</q-tooltip>
                            </q-btn>
                            <q-btn icon="edit" color="primary" size="sm" round flat dense @click="openEditDialog(props.row)">
                                <q-tooltip>Editar equipo</q-tooltip>
                            </q-btn>
                            <q-btn icon="delete" color="negative" size="sm" round flat dense @click="confirmDelete(props.row)">
                                <q-tooltip>Eliminar equipo</q-tooltip>
                            </q-btn>
                        </div>
                    </q-td>
                </template>

                <template v-slot:no-data>
                    <div class="full-width text-center q-py-xl">
                        <q-icon name="precision_manufacturing" size="56px" color="grey-4" class="q-mb-md"/>
                        <div class="text-body1 text-grey-6">No hay equipos o maquinaria para mostrar</div>
                        <div class="text-caption text-grey-5 q-mt-xs">
                            {{ zonaFiltro || aulaFiltro || searchQuery ? 'Intenta cambiar los filtros' : 'Registra tu primer equipo para comenzar' }}
                        </div>
                    </div>
                </template>
            </q-table>
        </q-card>

        <!-- ── Dialog Crear / Editar ────────────────────────────────── -->
        <q-dialog v-model="itemDialog" persistent>
            <q-card style="width: 600px; max-width: 95%;">
                <q-toolbar :class="isEditing ? 'bg-green-9' : 'bg-primary'" class="text-white">
                    <q-icon name="precision_manufacturing" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">
                        {{ isEditing ? 'Editar Equipo / Maquinaria' : 'Registrar Equipo / Maquinaria' }}
                    </q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>

                <q-card-section class="q-pt-md" style="max-height: 70vh; overflow-y: auto;">
                    <q-form @submit.prevent="submitItem" class="q-gutter-md">

                        <q-input
                            v-model="itemForm.nombre"
                            label="Nombre del equipo o maquinaria"
                            outlined dense autofocus counter maxlength="150"
                            :rules="[
                                val => !!val || 'El nombre es obligatorio',
                                val => val.length >= 3 || 'Mínimo 3 caracteres'
                            ]"
                        >
                            <template v-slot:prepend>
                                <q-icon name="label"/>
                            </template>
                        </q-input>

                        <!-- Número de placa SENA — identificador único del equipo -->
                        <q-input
                            v-model="itemForm.numero_placa"
                            label="Número de Placa SENA *"
                            outlined dense counter maxlength="50"
                            hint="Identificador único asignado por SENA al equipo"
                            :rules="[val => (!!val && val.trim().length > 0) || 'El número de placa es obligatorio']"
                        >
                            <template v-slot:prepend>
                                <q-icon name="qr_code_2" color="green-8"/>
                            </template>
                        </q-input>

                        <q-input
                            v-model="itemForm.descripcion"
                            label="Descripción"
                            type="textarea" rows="2"
                            outlined dense counter maxlength="500"
                        >
                            <template v-slot:prepend>
                                <q-icon name="description"/>
                            </template>
                        </q-input>

                        <div class="row q-col-gutter-md">
                            <div class="col-12 col-sm-6">
                                <q-select
                                    v-model="itemForm.zona"
                                    :options="zonas"
                                    option-value="_id"
                                    option-label="nombre"
                                    emit-value map-options
                                    label="Sede"
                                    outlined dense
                                    @update:model-value="itemForm.aula = null"
                                    :rules="[val => !!val || 'La sede es obligatoria']"
                                >
                                    <template v-slot:prepend>
                                        <q-icon name="category"/>
                                    </template>
                                </q-select>
                            </div>
                            <div class="col-12 col-sm-6">
                                <q-select
                                    v-model="itemForm.aula"
                                    :options="aulasFiltradas"
                                    option-value="_id"
                                    option-label="nombre"
                                    emit-value map-options
                                    label="Ambiente"
                                    outlined dense
                                    :disable="!itemForm.zona"
                                    :hint="!itemForm.zona ? 'Selecciona una sede primero' : ''"
                                    :rules="[val => !!val || 'El ambiente es obligatorio']"
                                >
                                    <template v-slot:prepend>
                                        <q-icon name="meeting_room"/>
                                    </template>
                                </q-select>
                            </div>
                        </div>

                        <!-- Stock: siempre 1 por unidad (placa única) -->
                        <div class="row q-col-gutter-md">
                            <div class="col-12 col-sm-6">
                                <!-- Al crear: fijo en 1, informativo -->
                                <q-input
                                    v-if="!isEditing"
                                    :model-value="1"
                                    label="Cantidad Total"
                                    type="number" outlined dense readonly
                                    bg-color="grey-2"
                                    hint="Cada equipo es una unidad única (placa SENA)"
                                >
                                    <template v-slot:prepend><q-icon name="inventory"/></template>
                                </q-input>
                                <!-- Al editar: readonly con info de préstamos -->
                                <q-input
                                    v-else
                                    :model-value="selectedItem?.cantidad_total_stock"
                                    label="Cantidad Total"
                                    type="number" outlined dense readonly
                                    bg-color="grey-2"
                                    hint="Usa Ajuste de Stock para modificar"
                                >
                                    <template v-slot:prepend><q-icon name="inventory"/></template>
                                </q-input>
                            </div>
                            <div class="col-12 col-sm-6">
                                <!-- Al crear: fijo en 1 -->
                                <q-input
                                    v-if="!isEditing"
                                    :model-value="1"
                                    label="Disponible"
                                    type="number" outlined dense readonly
                                    bg-color="grey-2"
                                    hint="Disponible al registrar: 1"
                                >
                                    <template v-slot:prepend><q-icon name="check_circle"/></template>
                                </q-input>
                                <!-- Al editar: disponible calculado (solo lectura) -->
                                <q-input
                                    v-else
                                    :model-value="stockInfo
                                        ? Math.max(0, (selectedItem?.cantidad_total_stock ?? 0) - stockInfo.unidades_en_prestamo)
                                        : selectedItem?.cantidad_disponible"
                                    label="Disponible (calculado)"
                                    outlined dense readonly
                                    bg-color="grey-2"
                                    :loading="loadingStockInfo"
                                    hint="total − en préstamo activo"
                                >
                                    <template v-slot:prepend><q-icon name="calculate"/></template>
                                </q-input>
                            </div>
                        </div>

                        <!-- Banner: unidades en préstamo activo (solo edición) -->
                        <q-banner
                            v-if="isEditing && stockInfo && stockInfo.unidades_en_prestamo > 0"
                            rounded dense class="q-mb-xs bg-orange-1 text-orange-9"
                        >
                            <template v-slot:avatar><q-icon name="info"/></template>
                            <strong>{{ stockInfo.unidades_en_prestamo }} unidad(es) actualmente en préstamo activo.</strong>
                            Usa el botón <q-icon name="tune" size="14px"/> <em>Ajustar stock</em> para registrar entradas o bajas.
                        </q-banner>

                        <div class="q-mb-md">
                            <div class="text-subtitle2 q-mb-sm">Imagen del equipo</div>

                            <q-btn-toggle
                                v-model="uploadMethod"
                                spread no-caps
                                toggle-color="primary"
                                color="white" text-color="grey-8"
                                :options="[
                                    {label: 'Subir Archivo', value: 'file', icon: 'upload'},
                                    {label: 'URL', value: 'url', icon: 'link'}
                                ]"
                                class="q-mb-md"
                            />

                            <div v-if="uploadMethod === 'file'">
                                <q-file
                                    v-model="imageFile"
                                    label="Seleccionar imagen"
                                    outlined dense accept="image/*"
                                    max-file-size="5242880"
                                    @update:model-value="handleImageFile"
                                    hint="JPG, PNG o GIF (máx. 5MB)"
                                >
                                    <template v-slot:prepend>
                                        <q-icon name="attach_file"/>
                                    </template>
                                    <template v-slot:append>
                                        <q-icon
                                            v-if="imageFile"
                                            name="close"
                                            @click.stop="removeImage"
                                            class="cursor-pointer"
                                        />
                                    </template>
                                </q-file>

                                <q-card
                                    v-if="!imageFile"
                                    flat bordered
                                    class="q-mt-sm q-pa-lg text-center cursor-pointer drag-drop-zone"
                                    @dragover.prevent
                                    @drop.prevent="(e) => handleImageFile(e.dataTransfer.files[0])"
                                >
                                    <q-icon name="cloud_upload" size="48px" color="grey-6"/>
                                    <div class="text-grey-7 q-mt-sm">
                                        Arrastra y suelta una imagen aquí
                                    </div>
                                    <div class="text-caption text-grey-6 q-mt-xs">
                                        o haz clic arriba para seleccionar
                                    </div>
                                </q-card>
                            </div>

                            <div v-else>
                                <q-input
                                    v-model="itemForm.imagen"
                                    label="URL de Imagen"
                                    outlined dense
                                    hint="URL de la imagen del equipo"
                                    @update:model-value="imagePreview = itemForm.imagen"
                                >
                                    <template v-slot:prepend>
                                        <q-icon name="image"/>
                                    </template>
                                </q-input>
                            </div>

                            <q-card v-if="imagePreview" flat bordered class="q-mt-md">
                                <q-card-section class="q-pa-sm">
                                    <div class="text-caption text-grey-7 q-mb-sm">Vista previa:</div>
                                    <q-img
                                        :src="imagePreview"
                                        style="max-height: 200px"
                                        fit="contain"
                                        spinner-color="primary"
                                    >
                                        <template v-slot:error>
                                            <div class="absolute-full flex flex-center bg-grey-3 text-grey-7">
                                                <q-icon name="broken_image" size="48px"/>
                                            </div>
                                        </template>
                                    </q-img>
                                    <q-btn
                                        flat dense icon="delete"
                                        label="Quitar imagen"
                                        color="negative" size="sm"
                                        class="q-mt-sm full-width"
                                        @click="removeImage"
                                    />
                                </q-card-section>
                            </q-card>
                        </div>

                        <q-card-actions align="right" class="q-mt-lg q-pb-none">
                            <q-btn flat label="Cancelar" color="grey" v-close-popup/>
                            <q-btn
                                type="submit"
                                :label="isEditing ? 'Guardar Cambios' : 'Registrar Equipo'"
                                :color="isEditing ? 'green-9' : 'primary'"
                                :icon="isEditing ? 'save' : 'add'"
                                :loading="submitting"
                            />
                        </q-card-actions>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>

        <div v-if="items.length > 0" class="q-mt-lg text-center">
        </div>

        <!-- ── Dialog Eliminar ───────────────────────────────────────── -->
        <q-dialog v-model="deleteDialog" persistent>
            <q-card style="width: 90vw; max-width: 450px;">
                <q-card-section class="row items-center">
                    <q-avatar icon="delete" color="negative" text-color="white"/>
                    <span class="q-ml-sm text-h6">Eliminar Equipo</span>
                </q-card-section>

                <q-card-section>
                    <div class="text-body1 q-mb-md">
                        ¿Estás seguro que deseas eliminar el equipo
                        <strong>"{{ itemToDelete?.nombre }}"</strong>?
                    </div>
                    <q-banner class="bg-negative-1 text-negative" rounded dense>
                        <template v-slot:avatar>
                            <q-icon name="warning" color="negative"/>
                        </template>
                        Esta acción no se puede deshacer.
                    </q-banner>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="grey" v-close-popup/>
                    <q-btn
                        flat label="Eliminar"
                        color="negative" icon="delete"
                        @click="deleteItem(itemToDelete)"
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- ── Diálogo Ajuste de Stock ───────────────────────────────── -->
        <q-dialog v-model="ajusteDialog" persistent>
            <q-card style="width: 500px; max-width: 95%;">
                <q-toolbar class="bg-dark text-white">
                    <q-icon name="tune" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">Ajuste de Stock</q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup :disable="ajustando"/>
                </q-toolbar>

                <q-card-section class="q-pt-md q-pb-xs">
                    <div class="row items-center q-mb-md" style="gap:10px;">
                        <div>
                            <div class="text-weight-bold text-dark" style="font-size:15px;">{{ ajusteItem?.nombre }}</div>
                            <div class="text-caption text-grey-6">
                                Placa: <strong>{{ ajusteItem?.numero_placa }}</strong>
                                · {{ ajusteItem?.aula?.nombre }} · {{ ajusteItem?.zona?.nombre }}
                            </div>
                        </div>
                    </div>

                    <!-- Tarjetas de stock actual -->
                    <div class="row q-col-gutter-sm q-mb-md">
                        <div class="col-4">
                            <div class="stock-stat-box text-center">
                                <div class="text-caption text-grey-5 q-mb-xs">TOTAL</div>
                                <div class="text-h5 text-weight-bold text-dark">{{ ajusteItem?.cantidad_total_stock }}</div>
                                <div class="text-caption text-grey-5">en sistema</div>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="stock-stat-box stock-stat-box--orange text-center">
                                <div class="text-caption text-orange-7 q-mb-xs">EN PRÉSTAMO</div>
                                <div class="text-h5 text-weight-bold text-orange-8">
                                    <q-spinner v-if="loadingAjusteInfo" size="20px"/>
                                    <span v-else>{{ ajusteStockInfo?.unidades_en_prestamo ?? 0 }}</span>
                                </div>
                                <div class="text-caption text-orange-6">comprometidas</div>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="stock-stat-box stock-stat-box--green text-center">
                                <div class="text-caption text-green-7 q-mb-xs">DISPONIBLE</div>
                                <div class="text-h5 text-weight-bold text-positive">{{ ajusteItem?.cantidad_disponible }}</div>
                                <div class="text-caption text-green-6">en almacén</div>
                            </div>
                        </div>
                    </div>
                </q-card-section>

                <!-- Tabs: solo Entrada y Baja para equipos (son devolutivos únicos) -->
                <q-tabs
                    v-model="ajusteForm.tipo"
                    dense no-caps
                    active-color="white"
                    indicator-color="transparent"
                    class="ajuste-tabs"
                >
                    <q-tab name="entrada" icon="add_circle"    label="Entrada" class="ajuste-tab ajuste-tab--entrada"/>
                    <q-tab name="baja"    icon="remove_circle" label="Baja"    class="ajuste-tab ajuste-tab--baja"/>
                </q-tabs>

                <q-card-section class="q-pt-sm">
                    <q-form @submit.prevent="submitAjuste" greedy>
                        <q-tab-panels v-model="ajusteForm.tipo" animated>

                            <!-- ── ENTRADA ── -->
                            <q-tab-panel name="entrada" class="q-pa-none q-pt-sm">
                                <q-banner dense rounded class="bg-green-1 text-green-10 q-mb-md">
                                    <template v-slot:avatar><q-icon name="info" color="primary"/></template>
                                    Se incorporan nuevas unidades de este tipo de equipo (cada una con su propia placa SENA).
                                    Esto aumenta el total disponible para préstamos.
                                </q-banner>
                                <q-input
                                    v-model.number="ajusteForm.cantidad"
                                    label="Unidades que ingresan"
                                    type="number" outlined dense min="1" class="q-mb-sm"
                                    :rules="[
                                        v => (v !== null && v !== '') || 'Obligatorio',
                                        v => Number.isInteger(Number(v)) || 'Solo enteros',
                                        v => v >= 1 || 'Mínimo 1'
                                    ]"
                                    @keydown="['.', ',', 'e', 'E', '+', '-'].includes($event.key) && $event.preventDefault()"
                                >
                                    <template v-slot:prepend><q-icon name="add" color="primary"/></template>
                                    <template v-slot:hint>
                                        Resultado → Total: <strong>{{ (ajusteItem?.cantidad_total_stock ?? 0) + (ajusteForm.cantidad || 0) }}</strong>
                                        · Disponible: <strong>{{ (ajusteItem?.cantidad_disponible ?? 0) + (ajusteForm.cantidad || 0) }}</strong>
                                    </template>
                                </q-input>
                            </q-tab-panel>

                            <!-- ── BAJA ── -->
                            <q-tab-panel name="baja" class="q-pa-none q-pt-sm">
                                <q-banner dense rounded class="bg-red-1 text-red-9 q-mb-md">
                                    <template v-slot:avatar><q-icon name="warning" color="red"/></template>
                                    Unidades dadas de baja <strong>definitivamente</strong> (rotura, pérdida, descarte).
                                    Solo puedes dar de baja unidades <strong>disponibles en almacén</strong>
                                    — las {{ ajusteStockInfo?.unidades_en_prestamo ?? 0 }} en préstamo no se pueden tocar.
                                </q-banner>
                                <q-input
                                    v-model.number="ajusteForm.cantidad"
                                    label="Unidades a dar de baja"
                                    type="number" outlined dense min="1"
                                    :max="ajusteItem?.cantidad_disponible"
                                    class="q-mb-sm"
                                    :rules="[
                                        v => (v !== null && v !== '') || 'Obligatorio',
                                        v => Number.isInteger(Number(v)) || 'Solo enteros',
                                        v => v >= 1 || 'Mínimo 1',
                                        v => v <= (ajusteItem?.cantidad_disponible ?? 0)
                                            || `Máximo ${ajusteItem?.cantidad_disponible} (unidades disponibles en almacén)`
                                    ]"
                                    @keydown="['.', ',', 'e', 'E', '+', '-'].includes($event.key) && $event.preventDefault()"
                                >
                                    <template v-slot:prepend><q-icon name="remove" color="red-8"/></template>
                                    <template v-slot:hint>
                                        Resultado → Total: <strong>{{ Math.max(0, (ajusteItem?.cantidad_total_stock ?? 0) - (ajusteForm.cantidad || 0)) }}</strong>
                                        · Disponible: <strong>{{ Math.max(0, (ajusteItem?.cantidad_disponible ?? 0) - (ajusteForm.cantidad || 0)) }}</strong>
                                    </template>
                                </q-input>
                            </q-tab-panel>

                        </q-tab-panels>

                        <!-- Motivo (común) -->
                        <q-input
                            v-model="ajusteForm.motivo"
                            label="Motivo *"
                            outlined dense type="textarea" rows="2"
                            maxlength="300" counter
                            :placeholder="ajusteForm.tipo === 'entrada'
                                ? 'Ej: Se incorporan 2 nuevos computadores HP adquiridos en…'
                                : 'Ej: Equipo dañado por caída, placa retirada de servicio…'"
                            :rules="[v => (v && v.trim().length >= 5) || 'Describe el motivo (mín. 5 caracteres)']"
                            class="q-mt-sm q-mb-md"
                        />

                        <q-card-actions align="right" class="q-pa-none">
                            <q-btn flat label="Cancelar" color="grey" v-close-popup :disable="ajustando"/>
                            <q-btn
                                type="submit"
                                :label="ajusteForm.tipo === 'entrada' ? 'Registrar entrada' : 'Registrar baja'"
                                :color="ajusteForm.tipo === 'entrada' ? 'teal' : 'red-8'"
                                :icon="ajusteForm.tipo === 'entrada' ? 'add_circle' : 'remove_circle'"
                                :loading="ajustando" unelevated no-caps
                            />
                        </q-card-actions>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>

    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { itemsService, zonesService, classroomsService } from '../../services/items.js';

const $q = useQuasar();
const router = useRouter();

// ── Estado ────────────────────────────────────────────────────
const items = ref([]);
const zonas = ref([]);
const aulas = ref([]);
const loading = ref(false);
const error = ref(null);

// ── Filtros ───────────────────────────────────────────────────
const zonaFiltro = ref(null);
const aulaFiltro = ref(null);
const searchQuery = ref('');

const itemDialog = ref(false);
const selectedItem = ref(null);
const submitting = ref(false);

const deleteDialog = ref(false);
const itemToDelete = ref(null);

// Info de stock con unidades en préstamo activo (solo edición)
const stockInfo        = ref(null);
const loadingStockInfo = ref(false);

// ── Ajuste de stock ───────────────────────────────────────────
const ajusteDialog      = ref(false);
const ajusteItem        = ref(null);
const ajusteStockInfo   = ref(null);
const loadingAjusteInfo = ref(false);
const ajustando         = ref(false);
const ajusteForm        = ref({ tipo: 'entrada', cantidad: null, motivo: '' });

const openAjusteDialog = async (item) => {
    ajusteItem.value      = item;
    ajusteStockInfo.value = null;
    ajusteForm.value      = { tipo: 'entrada', cantidad: null, motivo: '' };
    ajusteDialog.value    = true;
    loadingAjusteInfo.value = true;
    try {
        ajusteStockInfo.value = await itemsService.getStockInfo(item._id);
    } catch (e) {
        console.warn('No se pudo cargar stock info para ajuste:', e.message);
    } finally {
        loadingAjusteInfo.value = false;
    }
};

const submitAjuste = async () => {
    if (ajusteForm.value.cantidad === null || !ajusteForm.value.motivo?.trim()) return;
    ajustando.value = true;
    try {
        await itemsService.adjustStock(ajusteItem.value._id, {
            tipo:     ajusteForm.value.tipo,
            cantidad: ajusteForm.value.cantidad,
            motivo:   ajusteForm.value.motivo.trim(),
        });
        $q.notify({
            type: ajusteForm.value.tipo === 'baja' ? 'warning' : 'positive',
            message: ajusteForm.value.tipo === 'entrada'
                ? `✅ Entrada registrada: +${ajusteForm.value.cantidad} ud. en "${ajusteItem.value.nombre}"`
                : `⚠️ Baja registrada: -${ajusteForm.value.cantidad} ud. en "${ajusteItem.value.nombre}"`,
            position: 'top', timeout: 4000,
        });
        ajusteDialog.value = false;
        await loadItems();
    } catch (err) {
        $q.notify({
            type: 'negative',
            message: err?.response?.data?.message || 'Error al registrar el ajuste',
            position: 'top', timeout: 4000,
        });
    } finally {
        ajustando.value = false;
    }
};

// ── Columnas (incluye la placa SENA como columna destacada) ───
const itemColumns = [
    { name: 'nombre',    label: 'Equipo / Maquinaria', align: 'left',   field: 'nombre',         sortable: true, style: 'min-width: 200px' },
    { name: 'placa',     label: 'Placa SENA',           align: 'left',   field: 'numero_placa',   sortable: true, style: 'min-width: 140px' },
    { name: 'ubicacion', label: 'Ubicación',            align: 'left',   field: row => row.zona?.nombre, sortable: true, style: 'min-width: 160px' },
    { name: 'stock',     label: 'Stock',                align: 'center', field: 'cantidad_disponible', sortable: true, style: 'min-width: 120px' },
    { name: 'estado',    label: 'Estado',               align: 'center', field: 'estado',         sortable: true, style: 'width: 110px' },
    { name: 'acciones',  label: 'Acciones',             align: 'center', field: 'acciones',                       style: 'width: 100px' }
];

// ── Formulario ────────────────────────────────────────────────
const itemForm = ref({
    nombre: '',
    descripcion: '',
    zona: null,
    aula: null,
    cantidad_total_stock: 0,
    cantidad_disponible: 0,
    imagen: '',
    numero_placa: '',
    tipo_categoria: 'Equipo O Maquinaria'   // siempre fijo para esta vista
});

const imagePreview = ref(null);
const imageFile = ref(null);
const uploadMethod = ref('file');

const isEditing = computed(() => !!selectedItem.value);

// ── Computed ──────────────────────────────────────────────────
const aulasFiltradas = computed(() => {
    if (!itemForm.value.zona) return aulas.value;
    return aulas.value.filter(a => {
        const zonaId = a.zona?._id || a.zona;
        return zonaId === itemForm.value.zona;
    });
});

// Aulas disponibles en el filtro de la tabla (dependen de la zona filtro)
const aulasFiltroOptions = computed(() => {
    if (!zonaFiltro.value) return aulas.value;
    return aulas.value.filter(a => {
        const zonaId = a.zona?._id || a.zona;
        return zonaId === zonaFiltro.value;
    });
});

const filteredItems = computed(() => {
    let result = items.value;

    if (zonaFiltro.value) {
        result = result.filter(item => item.zona?._id === zonaFiltro.value);
    }
    if (aulaFiltro.value) {
        result = result.filter(item => item.aula?._id === aulaFiltro.value);
    }
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(item =>
            item.nombre.toLowerCase().includes(query) ||
            (item.descripcion && item.descripcion.toLowerCase().includes(query)) ||
            (item.numero_placa && item.numero_placa.toLowerCase().includes(query))
        );
    }
    return result;
});

const disponiblesCount = computed(() =>
    filteredItems.value.filter(item => item.estado === 'Disponible').length
);
const agotadosCount = computed(() =>
    filteredItems.value.filter(item => item.estado === 'Agotado').length
);

// ── Carga de datos ────────────────────────────────────────────
const loadInitialData = async () => {
    try {
        const [zonasData, aulasData] = await Promise.all([
            zonesService.getAll(),
            classroomsService.getAll()
        ]);
        zonas.value = zonasData;
        aulas.value = aulasData;
    } catch (err) {
        console.error('Error cargando datos iniciales:', err);
    }
};

const loadItems = async () => {
    loading.value = true;
    error.value = null;
    try {
        const data = await itemsService.getAll();
        // Solo equipos y maquinaria (devolutivos)
        items.value = data.filter(i => i.tipo_categoria === 'Equipo O Maquinaria');
    } catch (err) {
        console.error('Error cargando equipos:', err);
        error.value = 'Error al cargar los equipos. Por favor, intenta nuevamente.';
        $q.notify({
            type: 'negative',
            message: 'No se pudieron cargar los equipos',
            position: 'top',
            icon: 'error',
            timeout: 3000
        });
    } finally {
        loading.value = false;
    }
};

// ── Helpers de color de stock ─────────────────────────────────
const getStockColor = (item) => {
    const pct = (item.cantidad_disponible / item.cantidad_total_stock) * 100;
    if (pct === 0)   return 'negative';
    if (pct < 30)    return 'warning';
    if (pct < 70)    return 'info';
    return 'positive';
};
const getStockColorClass = (item) => {
    const pct = (item.cantidad_disponible / item.cantidad_total_stock) * 100;
    if (pct === 0)   return 'text-negative';
    if (pct < 30)    return 'text-warning';
    if (pct < 70)    return 'text-info';
    return 'text-positive';
};

// ── Dialogs ───────────────────────────────────────────────────
const openCreateDialog = () => {
    selectedItem.value = null;
    stockInfo.value    = null;
    itemForm.value = {
        nombre: '',
        descripcion: '',
        zona: null,
        aula: null,
        cantidad_total_stock: 1,   // siempre 1 — placa única
        cantidad_disponible:  1,
        imagen: '',
        numero_placa: '',
        tipo_categoria: 'Equipo O Maquinaria'
    };
    imagePreview.value = null;
    imageFile.value = null;
    uploadMethod.value = 'file';
    itemDialog.value = true;
};

const openEditDialog = async (item) => {
    selectedItem.value = item;
    stockInfo.value    = null;
    itemForm.value = {
        nombre:               item.nombre,
        descripcion:          item.descripcion || '',
        zona:                 item.zona?._id,
        aula:                 item.aula?._id,
        cantidad_total_stock: item.cantidad_total_stock,
        cantidad_disponible:  item.cantidad_disponible,
        imagen:               item.imagen || '',
        numero_placa:         item.numero_placa || '',
        tipo_categoria:       'Equipo O Maquinaria'
    };
    imagePreview.value = item.imagen || null;
    imageFile.value    = null;
    uploadMethod.value = 'file';
    itemDialog.value   = true;

    // Cargar info de stock comprometido en segundo plano
    loadingStockInfo.value = true;
    try {
        stockInfo.value = await itemsService.getStockInfo(item._id);
    } catch (e) {
        console.warn('No se pudo cargar stock info:', e.message);
    } finally {
        loadingStockInfo.value = false;
    }
};

const confirmDelete = (item) => {
    itemToDelete.value = item;
    deleteDialog.value = true;
};

// ── Imagen ────────────────────────────────────────────────────
const handleImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        $q.notify({ type: 'warning', message: 'Por favor selecciona un archivo de imagen válido', position: 'top', timeout: 2000 });
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        $q.notify({ type: 'warning', message: 'La imagen no debe superar 5MB', position: 'top', timeout: 2000 });
        return;
    }
    imageFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => { imagePreview.value = e.target.result; };
    reader.readAsDataURL(file);
};

const removeImage = () => {
    imagePreview.value = null;
    imageFile.value = null;
    itemForm.value.imagen = '';
};

const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// ── CRUD ──────────────────────────────────────────────────────
const submitItem = async () => {
    submitting.value = true;
    try {
        const formData = { ...itemForm.value };
        if (imageFile.value && uploadMethod.value === 'file') {
            formData.imagen = await convertImageToBase64(imageFile.value);
        }

        if (isEditing.value) {
            await itemsService.update(selectedItem.value._id, formData);
            $q.notify({
                type: 'info',
                message: 'Equipo actualizado exitosamente',
                position: 'top',
                icon: 'upload',
                timeout: 2500
            });
        } else {
            await itemsService.create(formData);
            $q.notify({
                type: 'positive',
                message: 'Equipo registrado exitosamente',
                position: 'top',
                icon: 'check_circle',
                timeout: 2500
            });
        }

        itemDialog.value = false;
        await loadItems();

    } catch (err) {
        console.error('Error al guardar equipo:', err);
        const errorMessage = err.response?.data?.message || 'No se pudo guardar el equipo';
        $q.notify({ type: 'negative', message: errorMessage, position: 'top', icon: 'error', timeout: 4000 });
    } finally {
        submitting.value = false;
    }
};

const deleteItem = async (item) => {
    if (!itemToDelete.value) return;
    try {
        await itemsService.delete((item || itemToDelete.value)._id);
        $q.notify({
            type: 'warning',
            message: 'Equipo eliminado exitosamente',
            position: 'top',
            icon: 'report_problem',
            timeout: 2500
        });
        deleteDialog.value = false;
        itemToDelete.value = null;
        await loadItems();
    } catch (err) {
        console.error('Error al eliminar equipo:', err);
        const errorMessage = err.response?.data?.message || 'No se pudo eliminar el equipo';
        $q.notify({ type: 'negative', message: errorMessage, position: 'top', icon: 'error', timeout: 4000 });
    }
};

onMounted(async () => {
    await loadInitialData();
    await loadItems();
});
</script>

<style scoped>
/* ── Variables ─────────────────────────────────────────────── */
:root {
    --c-primary: #1a4f00;
    --c-border: #e0e0e0;
    --radius-md: 10px;
    --radius-lg: 14px;
}

/* ── Page ──────────────────────────────────────────────────── */
.page-bg { background: #f5f5f5; }

/* ── Header ────────────────────────────────────────────────── */
.header-icon-wrap {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #1a4f00, #39A900);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(57,169,0,.3);
}
.lh-tight { line-height: 1.2; }
.action-btn { border-radius: 8px !important; }

/* ── Stat chips ─────────────────────────────────────────────── */
.stat-chip {
    border-radius: var(--radius-md);
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 2px solid transparent;
    transition: box-shadow .15s;
    min-height: 58px;
}
.stat-chip--blue   { background: #f0faf0; color: #39A900; border-color: #d4f0b0; }
.stat-chip--green  { background: #f0fdf4; color: #39A900; border-color: #d4f0b0; }
.stat-chip--red    { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
.stat-number { font-size: 20px; font-weight: 700; line-height: 1; }
.stat-label  { font-size: 11px; font-weight: 500; opacity: .8; }

/* ── Filter card ────────────────────────────────────────────── */
.filter-card {
    border-radius: var(--radius-md);
    border: 1px solid var(--c-border);
    box-shadow: 0 1px 4px rgba(0,0,0,.05);
    background: #fafafa;
}

/* ── Table card ─────────────────────────────────────────────── */
.table-card {
    border-radius: var(--radius-lg);
    border: 1px solid var(--c-border);
    overflow: hidden;
    box-shadow: 0 1px 8px rgba(0,0,0,.06);
}
.items-table :deep(thead tr th) {
    background: #1a4f00 !important;
    color: white !important;
    font-weight: 600 !important;
    font-size: 12px !important;
    text-transform: uppercase !important;
    letter-spacing: .6px;
    padding: 12px 10px !important;
    border: none !important;
}
.items-table :deep(tbody tr) { transition: background .12s; }
.items-table :deep(tbody tr:hover) { background: #f5fbf0 !important; }
.items-table :deep(tbody tr td) {
    padding: 10px !important;
    border-bottom: 1px solid #f0f0f0 !important;
    vertical-align: middle !important;
}

/* ── Item image ─────────────────────────────────────────────── */
.item-img-wrap {
    position: relative;
    width: 44px; height: 44px;
    border-radius: 8px;
    overflow: visible;
    flex-shrink: 0;
}
.item-img {
    width: 44px; height: 44px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    background: #fafafa;
    display: block;
}
.item-img-fallback {
    width: 44px; height: 44px;
    border-radius: 8px;
    background: #f0f0f0;
    border: 1px solid #e0e0e0;
    display: flex; align-items: center; justify-content: center;
}
.item-status-dot {
    position: absolute;
    bottom: -2px; right: -2px;
    width: 11px; height: 11px;
    border-radius: 50%;
    border: 2px solid white;
}
.item-status-dot--green { background: #39A900; }
.item-status-dot--red   { background: #dc2626; }

/* ── Placa SENA ─────────────────────────────────────────────── */
.placa-wrap {
    display: inline-flex;
    align-items: center;
    background: #e4f0d0;
    color: #1a4f00;
    border: 1px solid #a8d878;
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: .3px;
}

/* ── Cell helpers ───────────────────────────────────────────── */
.cell-primary   { color: #1e1e1e; font-size: 13px; font-weight: 500; }
.cell-secondary { color: #757575; font-size: 11.5px; margin-top: 1px; }
.text-weight-semibold { font-weight: 600; }
.desc-clamp {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    max-width: 200px;
}

/* ── Stock display ──────────────────────────────────────────── */
.stock-display { display: flex; align-items: baseline; gap: 3px; }
.stock-available { font-size: 14px; font-weight: 700; }
.stock-sep { color: #cccccc; font-size: 12px; }
.stock-total { color: #9e9e9e; font-size: 12px; }
.stock-bar { border-radius: 3px; }

/* ── Status badge ───────────────────────────────────────────── */
.status-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .3px;
}
.status-badge--disponible { background: #eaf7d8; color: #2d8600; }
.status-badge--agotado    { background: #fee2e2; color: #b91c1c; }

/* ── Drag drop ──────────────────────────────────────────────── */
.drag-drop-zone {
    border: 2px dashed #cccccc;
    transition: all .2s;
}
.drag-drop-zone:hover {
    border-color: #1a4f00;
    background: rgba(57,169,0,.04);
}

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 599px) {
    .page-bg { padding: 10px 8px !important; }
    .stat-chip { padding: 10px 10px; gap: 7px; }
    .stat-number { font-size: 17px; }
    .items-table :deep(tbody tr td) { padding: 8px 6px !important; }
    .item-img-wrap, .item-img, .item-img-fallback { width: 36px; height: 36px; }
    .desc-clamp { display: none; }
}
@media (max-width: 400px) {
    .stat-label { display: none; }
}

/* ── Ajuste de stock ─────────────────────────────────────────── */
.stock-stat-box {
    background: #fafafa;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 8px 10px;
}
.stock-stat-box--orange { border-color: #F4A010; background: #fff8e6; }
.stock-stat-box--green  { border-color: #39A900; background: #eaf7d8; }
.ajuste-tabs { background: #f5f5f5; border-bottom: 2px solid #e0e0e0; }
.ajuste-tab  { font-weight: 600; font-size: 12px; opacity: 0.6; transition: all .2s; }
.ajuste-tab.q-tab--active { opacity: 1; color: white !important; border-radius: 4px 4px 0 0; }
.ajuste-tab--entrada.q-tab--active { background: #2d8600; }
.ajuste-tab--baja.q-tab--active    { background: #c62828; }
</style>