<template>
    <q-page class="page-bg q-pa-md q-pa-sm-xs">

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
                    <q-icon name="inventory_2" size="20px" color="white"/>
                </div>
                <div>
                    <div class="text-h6 text-weight-bold text-dark lh-tight">Gestión de Materiales</div>
                    <div class="text-caption text-grey-6">Inventario de materiales consumibles y de uso controlado</div>
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

        <div v-if="items.length > 0" class="row q-col-gutter-sm q-mb-md">
            <div class="col-4">
                <div class="stat-chip stat-chip--blue">
                    <q-icon name="inventory_2" size="18px"/>
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

        <!-- Banner de scope para Admin normal -->
        <q-banner v-if="isAdmin" class="bg-teal-1 text-teal-9 q-mb-md" rounded dense>
            <template v-slot:avatar><q-icon name="lock" color="teal"/></template>
            <div class="text-caption">
                Estás viendo y gestionando materiales de
                <strong>{{ aulasPermitidas?.length || 0 }} ambiente(s) asignado(s)</strong>.
                Solo puedes crear, editar y eliminar ítems en esos ambientes.
            </div>
        </q-banner>

        <!-- Banner de advertencia si no tiene ambientes asignados -->
        <q-banner v-if="isAdmin && aulasPermitidas?.length === 0" class="bg-orange-1 text-orange-9 q-mb-md" rounded>
            <template v-slot:avatar><q-icon name="warning" color="orange"/></template>
            <strong>Sin ambientes asignados.</strong>
            No puedes gestionar ningún material hasta que el SuperAdmin te asigne ambientes
            desde <em>Panel Admin › Usuarios</em>.
        </q-banner>

        <q-card flat class="filter-card q-mb-md">
            <q-card-section class="q-py-sm">
                <div class="row q-col-gutter-sm">
                    <div class="col-12 col-sm-4">
                        <q-select
                            v-model="zonaFiltro"
                            :options="zonasDisponibles"
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
                            label="Buscar por nombre"
                            outlined dense clearable
                            bg-color="white"
                        >
                            <template v-slot:prepend><q-icon name="search" color="primary"/></template>
                        </q-input>
                    </div>
                </div>
            </q-card-section>
        </q-card>

        <div v-if="loading && !items.length" class="text-center q-py-xl">
            <q-spinner-dots size="56px" color="primary"/>
            <div class="text-body2 text-grey-6 q-mt-md">Cargando materiales...</div>
        </div>

        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="56px" color="negative" class="q-mb-md"/>
            <div class="text-body1 text-negative">{{ error }}</div>
            <q-btn color="primary" label="Reintentar" @click="loadItems" class="q-mt-md" unelevated/>
        </div>

        <q-card v-else class="table-card" flat>
            <q-table
                :rows="filteredItems"
                :columns="itemColumns"
                row-key="_id"
                flat
                :rows-per-page-options="[10, 25, 50, 0]"
                no-data-label="No hay materiales para mostrar"
                class="items-table"
            >
                <template v-slot:top>
                    <div class="row full-width items-center q-px-sm q-py-sm q-gutter-sm">
                        <div class="text-subtitle2 text-weight-bold text-dark col-auto">
                            Listado de materiales
                            <q-badge v-if="filteredItems.length" color="primary" class="q-ml-xs" :label="filteredItems.length"/>
                        </div>
                        <q-space/>
                        <q-btn
                            color="primary"
                            icon="add"
                            label="Añadir Material"
                            unelevated dense no-caps
                            @click="openCreateDialog"
                            style="border-radius:8px;"
                        />
                        <ImportarExcelDialog
                            modulo="materiales"
                            @importado="loadItems"
                        />
                    </div>
                </template>

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
                                            <q-icon name="inventory_2" size="18px" color="grey-5"/>
                                        </div>
                                    </template>
                                </q-img>
                                <div v-else class="item-img-fallback">
                                    <q-icon name="inventory_2" size="18px" color="grey-5"/>
                                </div>
                                <span class="item-status-dot" :class="props.row.estado === 'Disponible' ? 'item-status-dot--green' : 'item-status-dot--red'"/>
                            </div>
                            <div>
                                <div class="text-weight-semibold cell-primary">{{ props.row.nombre }}</div>
                                <div v-if="props.row.descripcion" class="cell-secondary desc-clamp">{{ props.row.descripcion }}</div>
                            </div>
                        </div>
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

                <template v-slot:body-cell-categoria="props">
                    <q-td :props="props">
                        <span class="cat-badge" :class="props.row.tipo_categoria === 'Consumible' ? 'cat-badge--orange' : 'cat-badge--blue'">
                            {{ props.row.tipo_categoria || 'N/A' }}
                        </span>
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
                            <q-btn icon="tune" color="teal" size="sm" round flat dense @click="openAjusteDialog(props.row)">
                                <q-tooltip>Ajustar stock (entradas / bajas)</q-tooltip>
                            </q-btn>
                            <q-btn icon="edit" color="primary" size="sm" round flat dense @click="openEditDialog(props.row)">
                                <q-tooltip>Editar material</q-tooltip>
                            </q-btn>
                            <q-btn icon="visibility_off" color="deep-orange" size="sm" round flat dense @click="confirmDelete(props.row)">
                                <q-tooltip>Inhabilitar material</q-tooltip>
                            </q-btn>
                        </div>
                    </q-td>
                </template>

                <template v-slot:no-data>
                    <div class="full-width text-center q-py-xl">
                        <q-icon name="inventory_2" size="56px" color="grey-4" class="q-mb-md"/>
                        <div class="text-body1 text-grey-6">No hay materiales para mostrar</div>
                        <div class="text-caption text-grey-5 q-mt-xs">
                            {{ zonaFiltro || aulaFiltro || searchQuery ? 'Intenta cambiar los filtros' : 'Crea tu primer material para comenzar' }}
                        </div>
                    </div>
                </template>
            </q-table>
        </q-card>

        <q-dialog v-model="itemDialog" persistent>
            <q-card style="width: 600px; max-width: 95%;">
                <q-toolbar :class="isEditing ? 'bg-green-9' : 'bg-primary'" class="text-white">
                    <q-icon name="inventory_2" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">
                        {{ isEditing ? 'Editar Material' : 'Crear Nuevo Material' }}
                    </q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>

                <q-card-section class="q-pt-md" style="max-height: 70vh; overflow-y: auto;">
                    <q-form @submit.prevent="submitItem" class="q-gutter-md">
                        <q-input 
                            v-model="itemForm.nombre"
                            label="Nombre del material" 
                            outlined 
                            dense
                            autofocus
                            counter
                            maxlength="150"
                            :rules="[
                                val => !!val || 'El nombre es obligatorio',
                                val => val.length >= 3 || 'Mínimo 3 caracteres'
                            ]"
                        >
                            <template v-slot:prepend>
                                <q-icon name="label" />
                            </template>
                        </q-input>

                        <q-input 
                            v-model="itemForm.descripcion"
                            label="Descripción" 
                            type="textarea" 
                            rows="2" 
                            outlined 
                            dense
                            counter
                            maxlength="500"
                        >
                            <template v-slot:prepend>
                                <q-icon name="description" />
                            </template>
                        </q-input>

                        <div class="row q-col-gutter-md">
                            <div class="col-12 col-sm-6">
                                <q-input
                                    :model-value="itemForm.codigo_unspsc"
                                    @update:model-value="v => itemForm.codigo_unspsc = String(v).replace(/\D/g, '').slice(0, 8)"
                                    @keydown="e => { if (!/^\d$/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'].includes(e.key)) e.preventDefault() }"
                                    @paste.prevent="e => { const txt = (e.clipboardData || window.clipboardData).getData('text'); itemForm.codigo_unspsc = txt.replace(/\D/g, '').slice(0, 8); }"
                                    label="Código UNSPSC"
                                    outlined dense
                                    maxlength="8"
                                    inputmode="numeric"
                                    hint="Solo números · Ej: 44111905"
                                    :rules="[v => !v || /^\d{8}$/.test(v) || 'Debe tener exactamente 8 dígitos']"
                                >
                                    <template v-slot:prepend><q-icon name="tag" color="primary"/></template>
                                    <template v-slot:append>
                                        <q-badge v-if="itemForm.codigo_unspsc" dense
                                            :color="itemForm.codigo_unspsc.length === 8 ? 'positive' : 'warning'"
                                            :label="itemForm.codigo_unspsc.length + '/8'"
                                        />
                                    </template>
                                </q-input>
                            </div>
                            <div class="col-12 col-sm-6">
                                <q-input
                                    v-model="itemForm.unidad_medida"
                                    label="Unidad de medida"
                                    outlined dense
                                    maxlength="50"
                                    hint="Ej: Unidad, Caja, Kit, Par, Resma"
                                >
                                    <template v-slot:prepend><q-icon name="straighten" /></template>
                                </q-input>
                            </div>
                        </div>

                        <q-input
                            v-model="itemForm.presentacion"
                            label="Presentación"
                            outlined dense
                            maxlength="300"
                            hint="Ej: Caja x 12 unidades, Kit 5 piezas, Maletín completo"
                        >
                            <template v-slot:prepend><q-icon name="inventory_2" /></template>
                        </q-input>

                        <div class="row q-col-gutter-md">
                            <div class="col-12 col-sm-6">
                                <q-select
                                    v-model="itemForm.zona"
                                    :options="zonasDisponibles"
                                    option-value="_id"
                                    option-label="nombre"
                                    emit-value
                                    map-options
                                    label="Sede" 
                                    outlined 
                                    dense
                                    @update:model-value="itemForm.aula = null"
                                    :rules="[val => !!val || 'La sede es obligatoria']"
                                    :readonly="isAdmin && zonasDisponibles.length === 1"
                                    :hint="isAdmin && zonasDisponibles.length === 1 ? 'Sede de tu ambiente asignado' : ''"
                                >
                                    <template v-slot:prepend>
                                        <q-icon name="category" />
                                    </template>
                                </q-select>
                            </div>
                            <div class="col-12 col-sm-6">
                                <q-select
                                    v-model="itemForm.aula"
                                    :options="aulasFiltradas"
                                    option-value="_id"
                                    option-label="nombre"
                                    emit-value
                                    map-options
                                    label="Ambiente" 
                                    outlined 
                                    dense
                                    :disable="!itemForm.zona"
                                    :hint="isAdmin ? 'Solo tus ambientes asignados' : (!itemForm.zona ? 'Selecciona una sede primero' : '')"
                                    :rules="[val => !!val || 'El ambiente es obligatorio']"
                                >
                                    <template v-slot:prepend>
                                        <q-icon name="meeting_room" />
                                    </template>
                                </q-select>
                            </div>
                        </div>

                        <div class="row q-col-gutter-md">
                            <div class="col-12 col-sm-6">
                                <q-input 
                                    v-model.number="itemForm.cantidad_total_stock"
                                    label="Cantidad Total" 
                                    type="number" 
                                    outlined 
                                    dense
                                    min="0"
                                    :rules="[
                                        val => val !== null && val !== '' || 'Obligatorio',
                                        val => val >= 0 || 'Debe ser mayor o igual a 0',
                                        val => !isEditing || !stockInfo || val >= stockInfo.unidades_en_prestamo
                                            || `Mínimo ${stockInfo.unidades_en_prestamo} (unidades en préstamo activo)`
                                    ]"
                                    :hint="isEditing && stockInfo?.unidades_en_prestamo > 0
                                        ? `Mín. ${stockInfo.unidades_en_prestamo} (en préstamo)`
                                        : undefined"
                                >
                                    <template v-slot:prepend>
                                        <q-icon name="inventory" />
                                    </template>
                                </q-input>
                            </div>
                            <div class="col-12 col-sm-6">
                                <q-input
                                    v-if="!isEditing"
                                    v-model.number="itemForm.cantidad_disponible"
                                    label="Cantidad Disponible"
                                    type="number"
                                    outlined dense min="0"
                                    :max="itemForm.cantidad_total_stock"
                                    :rules="[
                                        val => val !== null && val !== '' || 'Obligatorio',
                                        val => val >= 0 || 'Debe ser mayor o igual a 0',
                                        val => val <= itemForm.cantidad_total_stock || 'No puede superar el total'
                                    ]"
                                >
                                    <template v-slot:prepend><q-icon name="check_circle" /></template>
                                </q-input>
                                <q-input
                                    v-else
                                    :model-value="stockInfo
                                        ? Math.max(0, itemForm.cantidad_total_stock - stockInfo.unidades_en_prestamo)
                                        : itemForm.cantidad_disponible"
                                    label="Disponible (calculado)"
                                    outlined dense readonly
                                    bg-color="grey-2"
                                    :loading="loadingStockInfo"
                                    hint="Se recalcula al guardar: total − en préstamo"
                                >
                                    <template v-slot:prepend><q-icon name="calculate" /></template>
                                </q-input>
                            </div>
                        </div>

                        <q-banner
                            v-if="isEditing && stockInfo && stockInfo.unidades_en_prestamo > 0"
                            rounded dense
                            class="q-mb-sm"
                            :class="itemForm.cantidad_total_stock < stockInfo.unidades_en_prestamo
                                ? 'bg-red-1 text-red-9'
                                : 'bg-orange-1 text-orange-9'"
                        >
                            <template v-slot:avatar>
                                <q-icon :name="itemForm.cantidad_total_stock < stockInfo.unidades_en_prestamo ? 'error' : 'info'" />
                            </template>
                            <strong>{{ stockInfo.unidades_en_prestamo }} unidad(es) en préstamos activos.</strong>
                            <span v-if="itemForm.cantidad_total_stock < stockInfo.unidades_en_prestamo">
                                El nuevo total ({{ itemForm.cantidad_total_stock }}) es menor que las unidades comprometidas.
                                Al guardar el disponible quedará en 0.
                            </span>
                            <span v-else>
                                Al guardar, el disponible quedará en
                                <strong>{{ itemForm.cantidad_total_stock - stockInfo.unidades_en_prestamo }}</strong>.
                            </span>
                        </q-banner>

                        <q-select
                            v-model="itemForm.tipo_categoria"
                            :options="tiposCategoria"
                            label="Tipo de Categoría" 
                            outlined 
                            dense
                            :rules="[val => !!val || 'El tipo es obligatorio']"
                        >
                            <template v-slot:prepend>
                                <q-icon name="style" />
                            </template>
                        </q-select>

                        <q-select
                            v-model="itemForm.cuentadante"
                            :options="cuentadantes"
                            option-value="_id"
                            option-label="nombre"
                            emit-value map-options
                            label="Cuentadante *"
                            outlined dense
                            :rules="[val => !!val || 'El cuentadante es obligatorio']"
                            hint="Responsable del ítem ante el inventario SENA"
                        >
                            <template v-slot:prepend>
                                <q-icon name="badge" />
                            </template>
                            <template v-slot:no-option>
                                <q-item>
                                    <q-item-section class="text-grey-6 text-caption">
                                        No hay cuentadantes registrados. Ve a Sistema › Cuentadantes para crearlos.
                                    </q-item-section>
                                </q-item>
                            </template>
                        </q-select>

                        <div class="q-mb-md">
                            <div class="text-subtitle2 q-mb-sm">Imagen del material</div>
                            
                            <q-btn-toggle
                                v-model="uploadMethod"
                                spread
                                no-caps
                                toggle-color="primary"
                                color="white"
                                text-color="grey-8"
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
                                    outlined
                                    dense
                                    accept="image/*"
                                    max-file-size="5242880"
                                    @update:model-value="handleImageFile"
                                    hint="JPG, PNG o GIF (máx. 5MB)"
                                >
                                    <template v-slot:prepend>
                                        <q-icon name="attach_file" />
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
                                    flat 
                                    bordered 
                                    class="q-mt-sm q-pa-lg text-center cursor-pointer drag-drop-zone"
                                    @dragover.prevent
                                    @drop.prevent="(e) => handleImageFile(e.dataTransfer.files[0])"
                                >
                                    <q-icon name="cloud_upload" size="48px" color="grey-6" />
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
            outlined 
            dense
            hint="URL de la imagen del material"
            @update:model-value="imagePreview = itemForm.imagen"
        >
            <template v-slot:prepend>
                <q-icon name="image" />
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
                                                <q-icon name="broken_image" size="48px" />
                                            </div>
                                        </template>
                                    </q-img>
                                    <q-btn
                                        flat
                                        dense
                                        icon="delete"
                                        label="Quitar imagen"
                                        color="negative"
                                        size="sm"
                                        class="q-mt-sm full-width"
                                        @click="removeImage"
                                    />
                                </q-card-section>
                            </q-card>
                        </div>

                        <q-card-actions align="right" class="q-mt-lg q-pb-none">
                            <q-btn 
                                flat 
                                label="Cancelar" 
                                color="grey" 
                                v-close-popup
                            />
                            <q-btn 
                                type="submit" 
                                :label="isEditing ? 'Guardar Cambios' : 'Crear Material'"
                                :color="isEditing ? 'blue-8' : 'primary'"
                                :icon="isEditing ? 'save' : 'add'"
                                :loading="submitting"
                                :disable="!canSubmit"
                            >
                                <q-tooltip v-if="!canSubmit">
                                    Completa todos los campos obligatorios para continuar
                                </q-tooltip>
                            </q-btn>
                        </q-card-actions>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>

        <div v-if="items.length > 0" class="q-mt-lg text-center">
        </div>
    
        <q-dialog v-model="deleteDialog" persistent>
            <q-card style="width: 90vw; max-width: 450px;">
                <q-card-section class="row items-center">
                    <q-avatar icon="visibility_off" color="deep-orange" text-color="white" />
                    <span class="q-ml-sm text-h6">Inhabilitar Material</span>
                </q-card-section>

                <q-card-section>
                    <div class="text-body1 q-mb-md">
                        ¿Estás seguro que deseas inhabilitar el material
                        <strong>"{{ itemToDelete?.nombre }}"</strong>?
                    </div>
                    <q-banner class="bg-orange-1 text-orange-9" rounded dense>
                        <template v-slot:avatar>
                            <q-icon name="info" color="deep-orange" />
                        </template>
                        El ítem quedará oculto. El SuperAdmin puede reactivarlo desde el Archivo.
                    </q-banner>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="grey" v-close-popup />
                    <q-btn 
                        flat 
                        label="Inhabilitar" 
                        color="deep-orange" 
                        icon="visibility_off"
                        @click="deleteItem(itemToDelete)" 
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>

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
                            <div class="text-caption text-grey-6">{{ ajusteItem?.aula?.nombre }} · {{ ajusteItem?.zona?.nombre }}</div>
                        </div>
                        <q-space/>
                        <span class="cat-badge" :class="ajusteItem?.tipo_categoria === 'Consumible' ? 'cat-badge--orange' : 'cat-badge--blue'">
                            {{ ajusteItem?.tipo_categoria }}
                        </span>
                    </div>

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

                <q-tabs
                    v-model="ajusteForm.tipo"
                    dense no-caps
                    active-color="white"
                    indicator-color="transparent"
                    class="ajuste-tabs"
                >
                    <q-tab name="entrada"  icon="add_circle"    label="Entrada"  class="ajuste-tab ajuste-tab--entrada"/>
                    <q-tab name="baja"     icon="remove_circle" label="Baja"     class="ajuste-tab ajuste-tab--baja"/>
                    <q-tab name="ajuste"   icon="tune"          label="Ajuste disponible" class="ajuste-tab ajuste-tab--ajuste"/>
                </q-tabs>

                <q-card-section class="q-pt-sm">
                    <q-form @submit.prevent="submitAjuste" greedy>

                        <q-tab-panels v-model="ajusteForm.tipo" animated>

                            <q-tab-panel name="entrada" class="q-pa-none q-pt-sm">
                                <q-banner dense rounded class="bg-teal-1 text-teal-9 q-mb-md">
                                    <template v-slot:avatar><q-icon name="info" color="teal"/></template>
                                    Llegaron unidades nuevas. Se suman al <strong>total</strong> y al <strong>disponible</strong>.
                                    Las unidades en préstamo no se ven afectadas.
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
                                    <template v-slot:prepend><q-icon name="add" color="teal"/></template>
                                    <template v-slot:hint>
                                        Resultado → Total: <strong>{{ (ajusteItem?.cantidad_total_stock ?? 0) + (ajusteForm.cantidad || 0) }}</strong>
                                        · Disponible: <strong>{{ (ajusteItem?.cantidad_disponible ?? 0) + (ajusteForm.cantidad || 0) }}</strong>
                                    </template>
                                </q-input>
                            </q-tab-panel>

                            <q-tab-panel name="baja" class="q-pa-none q-pt-sm">
                                <q-banner dense rounded class="bg-red-1 text-red-9 q-mb-md">
                                    <template v-slot:avatar><q-icon name="warning" color="red"/></template>
                                    Unidades que se dan de baja <strong>definitivamente</strong> (daño, pérdida, descarte).
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

                            <q-tab-panel name="ajuste" class="q-pa-none q-pt-sm">
                                <q-banner dense rounded class="bg-teal-1 text-teal-9 q-mb-md">
                                    <template v-slot:avatar><q-icon name="info" color="blue"/></template>
                                    Corrige cuántas unidades hay <strong>físicamente en el almacén ahora</strong>,
                                    sin cambiar el total registrado. El valor no puede superar
                                    <strong>{{ (ajusteItem?.cantidad_total_stock ?? 0) - (ajusteStockInfo?.unidades_en_prestamo ?? 0) }}</strong>
                                    (total − en préstamo). Si necesitas más, usa <em>Entrada</em> primero.
                                </q-banner>
                                <q-input
                                    v-model.number="ajusteForm.cantidad"
                                    label="Unidades en almacén ahora"
                                    type="number" outlined dense min="0"
                                    :max="(ajusteItem?.cantidad_total_stock ?? 0) - (ajusteStockInfo?.unidades_en_prestamo ?? 0)"
                                    class="q-mb-sm"
                                    :rules="[
                                        v => (v !== null && v !== '') || 'Obligatorio',
                                        v => Number.isInteger(Number(v)) || 'Solo enteros',
                                        v => v >= 0 || 'Mínimo 0',
                                        v => v <= ((ajusteItem?.cantidad_total_stock ?? 0) - (ajusteStockInfo?.unidades_en_prestamo ?? 0))
                                            || `Máximo ${(ajusteItem?.cantidad_total_stock ?? 0) - (ajusteStockInfo?.unidades_en_prestamo ?? 0)} (total − en préstamo)`
                                    ]"
                                    @keydown="['.', ',', 'e', 'E', '+', '-'].includes($event.key) && $event.preventDefault()"
                                >
                                    <template v-slot:prepend><q-icon name="tune" color="blue-7"/></template>
                                    <template v-slot:hint>
                                        Resultado → Total: <strong>{{ ajusteItem?.cantidad_total_stock }}</strong> (sin cambio)
                                        · Disponible: <strong>{{ ajusteForm.cantidad ?? '—' }}</strong>
                                        · En préstamo: <strong>{{ ajusteStockInfo?.unidades_en_prestamo ?? 0 }}</strong> (sin cambio)
                                    </template>
                                </q-input>

                                <q-banner
                                    v-if="ajusteForm.cantidad !== null && ajusteForm.cantidad !== ajusteItem?.cantidad_disponible"
                                    dense rounded class="q-mb-sm"
                                    :class="(ajusteForm.cantidad || 0) < (ajusteItem?.cantidad_disponible ?? 0)
                                        ? 'bg-orange-1 text-orange-9' : 'bg-teal-1 text-teal-9'">
                                    <template v-slot:avatar>
                                        <q-icon :name="(ajusteForm.cantidad || 0) < (ajusteItem?.cantidad_disponible ?? 0) ? 'trending_down' : 'trending_up'"/>
                                    </template>
                                    <span v-if="(ajusteForm.cantidad || 0) < (ajusteItem?.cantidad_disponible ?? 0)">
                                        El disponible <strong>bajará {{ (ajusteItem?.cantidad_disponible ?? 0) - (ajusteForm.cantidad || 0) }} ud.</strong>
                                        ({{ ajusteItem?.cantidad_disponible }} → {{ ajusteForm.cantidad }})
                                    </span>
                                    <span v-else>
                                        El disponible <strong>subirá {{ (ajusteForm.cantidad || 0) - (ajusteItem?.cantidad_disponible ?? 0) }} ud.</strong>
                                        ({{ ajusteItem?.cantidad_disponible }} → {{ ajusteForm.cantidad }})
                                    </span>
                                </q-banner>
                            </q-tab-panel>

                        </q-tab-panels>

                        <q-input
                            v-model="ajusteForm.motivo"
                            label="Motivo *"
                            outlined dense type="textarea" rows="2"
                            maxlength="300" counter
                            :placeholder="ajusteForm.tipo === 'entrada'
                                ? 'Ej: Compra de 50 unidades nuevas, donación recibida…'
                                : ajusteForm.tipo === 'baja'
                                    ? 'Ej: 3 unidades dañadas por humedad, pérdida reportada…'
                                    : 'Ej: Conteo físico realizado, reabastecimiento de consumibles…'"
                            :rules="[v => (v && v.trim().length >= 5) || 'Describe el motivo (mín. 5 caracteres)']"
                            class="q-mt-sm q-mb-md"
                        />

                        <q-card-actions align="right" class="q-pa-none">
                            <q-btn flat label="Cancelar" color="grey" v-close-popup :disable="ajustando"/>
                            <q-btn
                                type="submit"
                                :label="ajusteForm.tipo === 'entrada' ? 'Registrar entrada'
                                      : ajusteForm.tipo === 'baja'    ? 'Registrar baja'
                                      : 'Aplicar ajuste'"
                                :color="ajusteForm.tipo === 'entrada' ? 'teal'
                                      : ajusteForm.tipo === 'baja'    ? 'red-8'
                                      : 'blue-7'"
                                :icon="ajusteForm.tipo === 'entrada' ? 'add_circle'
                                     : ajusteForm.tipo === 'baja'    ? 'remove_circle'
                                     : 'check'"
                                :loading="ajustando"
                                unelevated no-caps
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
import { itemsService, zonesService, classroomsService, cuentadantesService } from '../../services/items.js';
import ImportarExcelDialog from '../../components/ImportarExcelDialog.vue';
import { useAdminScope } from '../../services/useAdminScope.js';

const $q = useQuasar();
const router = useRouter();
const { isSuperAdmin, isAdmin, aulasPermitidas, zonasPermitidas, loadScope, filtrarAulas, filtrarZonas } = useAdminScope();

const items = ref([]);
const zonas = ref([]);
const aulas = ref([]);
const cuentadantes = ref([]);
const loading = ref(false);
const error = ref(null);

const zonaFiltro = ref(null);
const aulaFiltro = ref(null);
const searchQuery = ref('');

const itemDialog = ref(false);
const selectedItem = ref(null);
const submitting = ref(false);

const tiposCategoria = [
    'Consumible',
    'De Uso Controlado',
];

const itemColumns = [
    { name: 'nombre', label: 'Material', align: 'left', field: 'nombre', sortable: true, style: 'min-width: 220px' },
    { name: 'ubicacion', label: 'Sede / Ambiente', align: 'left', field: row => row.zona?.nombre, sortable: true, style: 'min-width: 170px' },
    { name: 'stock', label: 'Stock', align: 'center', field: 'cantidad_disponible', sortable: true, style: 'min-width: 120px' },
    { name: 'categoria', label: 'Categoría', align: 'center', field: 'tipo_categoria', sortable: true, style: 'min-width: 130px' },
    { name: 'estado', label: 'Estado', align: 'center', field: 'estado', sortable: true, style: 'width: 110px' },
    { name: 'acciones', label: 'Acciones', align: 'center', field: 'acciones', style: 'width: 100px' }
];

const deleteDialog = ref(false);
const itemToDelete = ref(null);

const ajusteDialog    = ref(false);
const ajusteItem      = ref(null);
const ajusteStockInfo = ref(null);
const loadingAjusteInfo = ref(false);
const ajustando       = ref(false);
const ajusteForm      = ref({ tipo: 'entrada', cantidad: null, motivo: '' });

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
                : ajusteForm.value.tipo === 'ajuste'
                    ? `✅ Ajuste aplicado: disponible → ${ajusteForm.value.cantidad} ud. en "${ajusteItem.value.nombre}"`
                    : `⚠️ Baja registrada: -${ajusteForm.value.cantidad} ud. en "${ajusteItem.value.nombre}"`,
            position: 'top',
            timeout: 4000,
        });
        ajusteDialog.value = false;
        await loadItems();
    } catch (err) {
        $q.notify({
            type: 'negative',
            message: err?.response?.data?.message || 'Error al registrar el ajuste',
            position: 'top',
            timeout: 4000,
        });
    } finally {
        ajustando.value = false;
    }
};


const itemForm = ref({
    nombre: '',
    descripcion: '',
    codigo_unspsc: '',
    unidad_medida: '',
    presentacion: '',
    zona: null,
    aula: null,
    cantidad_total_stock: 0,
    cantidad_disponible: 0,
    imagen: '',
    tipo_categoria: 'Consumible',
    cuentadante: null
});

const stockInfo = ref(null);
const loadingStockInfo = ref(false);

const imagePreview = ref(null);
const imageFile = ref(null);
const uploadMethod = ref('file');

const isEditing = computed(() => !!selectedItem.value);

const canSubmit = computed(() => {
    const f = itemForm.value;
    const nombreOk   = f.nombre?.trim().length >= 3;
    const zonaOk     = !!f.zona;
    const aulaOk     = !!f.aula;
    const tipoOk     = !!f.tipo_categoria;
    const cuentadanteOk = !!f.cuentadante;
    const unspscOk   = !f.codigo_unspsc || /^\d{8}$/.test(f.codigo_unspsc);
    const cantTotalOk = f.cantidad_total_stock !== '' && f.cantidad_total_stock !== null
                        && Number(f.cantidad_total_stock) >= 0;
    const cantDispOk = isEditing.value
        ? true
        : (f.cantidad_disponible !== '' && f.cantidad_disponible !== null
            && Number(f.cantidad_disponible) >= 0
            && Number(f.cantidad_disponible) <= Number(f.cantidad_total_stock));
    return nombreOk && zonaOk && aulaOk && tipoOk && cuentadanteOk && unspscOk && cantTotalOk && cantDispOk;
});

// Para Admin: usa solo sus aulas asignadas; para SuperAdmin: todas las aulas
const aulasDisponibles = computed(() =>
    isAdmin.value ? (aulasPermitidas.value || []) : aulas.value
);
const zonasDisponibles = computed(() =>
    isAdmin.value ? (zonasPermitidas.value || []) : zonas.value
);

const aulasFiltradas = computed(() => {
    const pool = aulasDisponibles.value;
    if (!itemForm.value.zona) return pool;
    return pool.filter(a => {
        const zonaId = a.zona?._id || a.zona;
        return zonaId === itemForm.value.zona;
    });
});

const aulasFiltroOptions = computed(() => {
    const pool = aulasDisponibles.value;
    if (!zonaFiltro.value) return pool;
    return pool.filter(a => {
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
            (item.descripcion && item.descripcion.toLowerCase().includes(query))
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

const loadInitialData = async () => {
    try {
        // Cargar scope del admin PRIMERO para poder filtrar correctamente
        await loadScope();
        const [zonasData, aulasData, cuentadantesData] = await Promise.all([
            zonesService.getAll(),
            classroomsService.getAll(),
            cuentadantesService.getAll()
        ]);
        zonas.value = zonasData;
        aulas.value = aulasData;
        cuentadantes.value = cuentadantesData;

        // Si el admin tiene solo un ambiente, pre-seleccionarlo en los filtros
        if (isAdmin.value && (aulasPermitidas.value || []).length === 1) {
            const solaAula = aulasPermitidas.value[0];
            const zonaId   = solaAula.zona?._id || solaAula.zona;
            zonaFiltro.value = String(zonaId);
            aulaFiltro.value = String(solaAula._id);
        }
    } catch (err) {
        console.error('Error cargando datos iniciales:', err);
    }
};

const loadItems = async () => {
    loading.value = true;
    error.value = null;
    
    try {
        const data = await itemsService.getAll();
        items.value = data.filter(i => i.tipo_categoria === 'Consumible' || i.tipo_categoria === 'De Uso Controlado');
    } catch (err) {
        console.error('Error cargando equipos o maquinarias:', err);
        error.value = 'Error al cargar los materiales. Por favor, intenta nuevamente.';
        
        $q.notify({
            type: 'negative',
            message: 'No se pudieron cargar los materiales',
            position: 'top',
            icon: 'error',
            timeout: 3000
        });
    } finally {
        loading.value = false;
    }
};

const getStockColor = (item) => {
    const percentage = (item.cantidad_disponible / item.cantidad_total_stock) * 100;
    if (percentage === 0) return 'negative';
    if (percentage < 30) return 'warning';
    if (percentage < 70) return 'info';
    return 'positive';
};

const getStockColorClass = (item) => {
    const percentage = (item.cantidad_disponible / item.cantidad_total_stock) * 100;
    if (percentage === 0) return 'text-negative';
    if (percentage < 30) return 'text-warning';
    if (percentage < 70) return 'text-info';
    return 'text-positive';
};

const openCreateDialog = () => {
    selectedItem.value = null;
    stockInfo.value = null;

    // Pre-asignar zona/aula si el Admin tiene exactamente un ambiente
    let defaultZona = null;
    let defaultAula = null;
    if (isAdmin.value && (aulasPermitidas.value || []).length === 1) {
        const solaAula = aulasPermitidas.value[0];
        defaultAula = String(solaAula._id);
        defaultZona = String(solaAula.zona?._id || solaAula.zona);
    }

    itemForm.value = {
        nombre: '',
        descripcion: '',
        codigo_unspsc: '',
        unidad_medida: '',
        presentacion: '',
        zona: defaultZona,
        aula: defaultAula,
        cantidad_total_stock: 0,
        cantidad_disponible: 0,
        imagen: '',
        tipo_categoria: 'Consumible',
        cuentadante: null
    };
    imagePreview.value = null;
    imageFile.value = null;
    uploadMethod.value = 'file';
    itemDialog.value = true;
};

const resolveZonaId = (zonaField) => {
    if (!zonaField) return null;
    if (typeof zonaField === 'string' && zonas.value.find(z => z._id === zonaField)) return zonaField;
    if (zonaField._id && zonas.value.find(z => z._id === zonaField._id)) return zonaField._id;
    const nombre = (zonaField.nombre || zonaField).toString().trim().toLowerCase();
    const found = zonas.value.find(z => z.nombre.trim().toLowerCase() === nombre);
    return found?._id || null;
};

const resolveAulaId = (aulaField, zonaId) => {
    if (!aulaField) return null;
    if (typeof aulaField === 'string' && aulas.value.find(a => a._id === aulaField)) return aulaField;
    if (aulaField._id && aulas.value.find(a => a._id === aulaField._id)) return aulaField._id;
    const nombre = (aulaField.nombre || aulaField).toString().trim().toLowerCase();
    const pool = zonaId ? aulas.value.filter(a => (a.zona?._id || a.zona) === zonaId) : aulas.value;
    const found = pool.find(a => a.nombre.trim().toLowerCase() === nombre);
    return found?._id || null;
};

const resolveTipoCategoria = (tipo) => {
    const opciones = ['Consumible', 'De Uso Controlado'];
    if (!tipo) return 'Consumible';
    const match = opciones.find(o => o.toLowerCase() === tipo.toString().trim().toLowerCase());
    return match || 'Consumible';
};

const openEditDialog = async (item) => {
    selectedItem.value = item;
    const zonaId = resolveZonaId(item.zona);
    const aulaId = resolveAulaId(item.aula, zonaId);
    itemForm.value = {
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        codigo_unspsc: item.codigo_unspsc || '',
        unidad_medida: item.unidad_medida || '',
        presentacion: item.presentacion || '',
        zona: zonaId,
        aula: aulaId,
        cantidad_total_stock: item.cantidad_total_stock,
        cantidad_disponible: item.cantidad_disponible,
        imagen: item.imagen || '',
        tipo_categoria: resolveTipoCategoria(item.tipo_categoria),
        cuentadante: item.cuentadante?._id || item.cuentadante || null
    };
    imagePreview.value = item.imagen || null;
    imageFile.value = null;
    uploadMethod.value = item.imagen ? 'file' : 'file';
    stockInfo.value = null;
    itemDialog.value = true;

    loadingStockInfo.value = true;
    try {
        stockInfo.value = await itemsService.getStockInfo(item._id);
    } catch (e) {
        console.warn('No se pudo cargar stock info:', e.message);
    } finally {
        loadingStockInfo.value = false;
    }
};

const handleImageFile = (file) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        $q.notify({
            type: 'warning',
            message: 'Por favor selecciona un archivo de imagen válido',
            position: 'top',
            timeout: 2000
        });
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        $q.notify({
            type: 'warning',
            message: 'La imagen no debe superar 5MB',
            position: 'top',
            timeout: 2000
        });
        return;
    }
    
    imageFile.value = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.value = e.target.result;
    };
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
                message: 'Material actualizado exitosamente',
                position: 'top',
                icon: 'upload',
                timeout: 2500
            });
        } else {
            await itemsService.create(formData);
            
            $q.notify({
                type: 'positive',
                message: 'Material creado exitosamente',
                position: 'top',
                icon: 'check_circle',
                timeout: 2500
            });
        }

        itemDialog.value = false;
        await loadItems();

    } catch (err) {
        console.error('Error al guardar material:', err);
        
        const errorMessage = err.response?.data?.message || 'No se pudo guardar el material';
        
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

const confirmDelete = (item) => {
    itemToDelete.value = item;
    deleteDialog.value = true;
};


const deleteItem = async (item) => {
    if (!itemToDelete.value) return;
    
    try {
        await itemsService.delete((item || itemToDelete.value)._id);

        $q.notify({
            type: 'warning',
            message: 'Material eliminado exitosamente',
            position: 'top',
            icon: 'report_problem',
            timeout: 2500
        });

        deleteDialog.value = false;
        itemToDelete.value = null;
        await loadItems();

    } catch (err) {
        console.error('Error al eliminar material:', err);
        
        const errorMessage = err.response?.data?.message || 'No se pudo eliminar el material';
        
        $q.notify({
            type: 'negative',
            message: errorMessage,
            position: 'top',
            icon: 'error',
            timeout: 4000
        });
    }
};


onMounted(async () => {
    await loadInitialData();
    await loadItems();
});
</script>

<style scoped>
:root {
    --c-primary: #39A900;
    --c-border: #e2e8f0;
    --radius-md: 10px;
    --radius-lg: 14px;
}

.page-bg { background: #f0f4f8; }

.header-icon-wrap {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #2d8000, #39A900);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(21,101,192,.3);
}
.lh-tight { line-height: 1.2; }
.action-btn { border-radius: 8px !important; }

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
.stat-chip--blue   { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
.stat-chip--green  { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
.stat-chip--red    { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
.stat-number { font-size: 20px; font-weight: 700; line-height: 1; }
.stat-label  { font-size: 11px; font-weight: 500; opacity: .8; }

.filter-card {
    border-radius: var(--radius-md);
    border: 1px solid var(--c-border);
    box-shadow: 0 1px 4px rgba(0,0,0,.05);
    background: #f8fafc;
}

.table-card {
    border-radius: var(--radius-lg);
    border: 1px solid var(--c-border);
    overflow: hidden;
    box-shadow: 0 1px 8px rgba(0,0,0,.06);
}
.items-table :deep(thead tr th) {
    background: #39A900 !important;
    color: white !important;
    font-weight: 600 !important;
    font-size: 12px !important;
    text-transform: uppercase !important;
    letter-spacing: .6px;
    padding: 12px 10px !important;
    border: none !important;
}
.items-table :deep(tbody tr) { transition: background .12s; }
.items-table :deep(tbody tr:hover) { background: #f8faff !important; }
.items-table :deep(tbody tr td) {
    padding: 10px !important;
    border-bottom: 1px solid #f1f5f9 !important;
    vertical-align: middle !important;
}

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
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    display: block;
}
.item-img-fallback {
    width: 44px; height: 44px;
    border-radius: 8px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    display: flex; align-items: center; justify-content: center;
}
.item-status-dot {
    position: absolute;
    bottom: -2px; right: -2px;
    width: 11px; height: 11px;
    border-radius: 50%;
    border: 2px solid white;
}
.item-status-dot--green { background: #16a34a; }
.item-status-dot--red   { background: #dc2626; }

.cell-primary   { color: #1e293b; font-size: 13px; font-weight: 500; }
.cell-secondary { color: #64748b; font-size: 11.5px; margin-top: 1px; }
.text-weight-semibold { font-weight: 600; }
.desc-clamp {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    max-width: 200px;
}

.stock-display { display: flex; align-items: baseline; gap: 3px; }
.stock-available { font-size: 14px; font-weight: 700; }
.stock-sep { color: #cbd5e1; font-size: 12px; }
.stock-total { color: #94a3b8; font-size: 12px; }
.stock-bar { border-radius: 3px; }

.cat-badge {
    display: inline-block;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 11px; font-weight: 600;
    letter-spacing: .2px;
}
.cat-badge--orange { background: #fff7ed; color: #111111; border: 1px solid #fed7aa; }
.cat-badge--blue   { background: #eff6ff; color: #111111; border: 1px solid #bfdbfe; }

.status-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .3px;
}
.status-badge--disponible { background: #dcfce7; color: #15803d; }
.status-badge--agotado    { background: #fee2e2; color: #b91c1c; }

.drag-drop-zone {
    border: 2px dashed #cbd5e1;
    transition: all .2s;
}
.drag-drop-zone:hover {
    border-color: #39A900;
    background: rgba(21,101,192,.04);
}

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
.ajuste-tabs { background: #f0f4f8; border-bottom: 2px solid #e2e8f0; }
.ajuste-tab  { font-weight: 600; font-size: 12px; opacity: 0.6; transition: all .2s; }
.ajuste-tab.q-tab--active { opacity: 1; color: white !important; border-radius: 4px 4px 0 0; }
.ajuste-tab--entrada.q-tab--active { background: #00897b; }
.ajuste-tab--baja.q-tab--active    { background: #c62828; }
.ajuste-tab--ajuste.q-tab--active  { background: #39A900; }
.stock-stat-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 10px;
    text-align: center;
}
.stock-stat-box--orange { border-color: #fb8c00; background: #fff8e1; }
.stock-stat-box--green  { border-color: #43a047; background: #e8f5e9; }
.preview-ajuste {
    background: #f0f4f8;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
}
</style>