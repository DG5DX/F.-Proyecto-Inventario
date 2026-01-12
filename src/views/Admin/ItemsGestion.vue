<template>
    <q-page class="q-pa-md bg-grey-2">
        <!-- Header -->
        <div class="row items-center q-mb-md">
            <q-btn 
                icon="arrow_back" 
                flat 
                round 
                dense 
                color="secondary"
                @click="router.push({ name: 'admin.classrooms' })" 
                class="q-mr-sm"
            >
                <q-tooltip>Volver a Aulas</q-tooltip>
            </q-btn>
            <q-icon name="inventory_2" size="md" color="primary" class="q-mr-sm"/>
            <div class="text-h5 text-weight-bold text-dark">
                Gestión de Ítems
            </div>
            <q-space />
            <q-btn 
                color="primary" 
                icon="refresh" 
                label="Actualizar" 
                flat 
                dense 
                @click="loadItems"
                :loading="loading"
            />
        </div>

        <!-- Filtros -->
        <q-card flat bordered class="q-mb-md">
            <q-card-section>
                <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-4">
                        <q-select
                            v-model="categoriaFiltro"
                            :options="categorias"
                            option-value="_id"
                            option-label="nombre"
                            emit-value
                            map-options
                            label="Filtrar por Categoría"
                            outlined
                            dense
                            clearable
                        >
                            <template v-slot:prepend>
                                <q-icon name="category" />
                            </template>
                        </q-select>
                    </div>
                    <div class="col-12 col-md-4">
                        <q-select
                            v-model="aulaFiltro"
                            :options="aulas"
                            option-value="_id"
                            option-label="nombre"
                            emit-value
                            map-options
                            label="Filtrar por Aula"
                            outlined
                            dense
                            clearable
                        >
                            <template v-slot:prepend>
                                <q-icon name="meeting_room" />
                            </template>
                        </q-select>
                    </div>
                    <div class="col-12 col-md-4">
                        <q-input
                            v-model="searchQuery"
                            label="Buscar por nombre"
                            outlined
                            dense
                            clearable
                        >
                            <template v-slot:prepend>
                                <q-icon name="search" />
                            </template>
                        </q-input>
                    </div>
                </div>
            </q-card-section>
        </q-card>

        <!-- Loading State -->
        <div v-if="loading && !items.length" class="text-center q-py-xl">
            <q-spinner-dots size="64px" color="primary" />
            <div class="text-h6 text-grey-6 q-mt-md">Cargando Ítems...</div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="64px" color="negative" class="q-mb-md"/>
            <div class="text-h6 text-negative">{{ error }}</div>
            <q-btn 
                color="primary" 
                label="Reintentar" 
                @click="loadItems" 
                class="q-mt-md"
            />
        </div>

        <!-- Card de Ítems -->
        <q-card v-else flat bordered>
            <q-card-section class="row items-center">
                <div class="text-h6">Listado de Ítems</div>
                <q-space/>
                <q-btn 
                    color="primary" 
                    icon="add" 
                    label="Añadir Ítem" 
                    @click="openCreateDialog"
                />
            </q-card-section>

            <q-separator />

            <!-- Vista de cards (grid) -->
            <q-card-section v-if="filteredItems.length > 0">
                <div class="row q-col-gutter-md">
                    <div 
                        v-for="item in filteredItems" 
                        :key="item._id"
                        class="col-12 col-sm-6 col-md-4 col-lg-3"
                    >
                        <q-card flat bordered class="item-card">
                            <q-card-section class="row no-wrap items-center">
                                <q-avatar 
                                    size="50px"
                                    :color="item.estado === 'Disponible' ? 'positive' : 'negative'"
                                    text-color="white"
                                    icon="inventory_2"
                                />
                                <div class="col q-ml-md">
                                    <div class="text-weight-bold ellipsis">
                                        {{ item.nombre }}
                                    </div>
                                    <div class="text-caption text-grey-7 ellipsis">
                                        {{ item.categoria?.nombre || 'N/A' }}
                                    </div>
                                    <div class="text-caption text-grey-6">
                                        {{ item.aula?.nombre || 'N/A' }}
                                    </div>
                                </div>
                            </q-card-section>

                            <q-separator />

                            <q-card-section class="q-pt-sm q-pb-sm">
                                <div class="row items-center">
                                    <div class="col">
                                        <div class="text-caption text-grey-7">Stock</div>
                                        <div 
                                            class="text-weight-bold"
                                            :class="getStockColorClass(item)"
                                        >
                                            {{ item.cantidad_disponible }} / {{ item.cantidad_total_stock }}
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <q-badge 
                                            :color="item.estado === 'Disponible' ? 'positive' : 'negative'"
                                            :label="item.estado"
                                        />
                                    </div>
                                </div>
                                <q-linear-progress 
                                    :value="(item.cantidad_disponible / item.cantidad_total_stock)" 
                                    :color="getStockColor(item)"
                                    size="8px"
                                    class="q-mt-xs"
                                />
                            </q-card-section>

                            <q-separator />

                            <q-card-actions align="right">
                                <q-btn 
                                    icon="edit" 
                                    color="blue-8" 
                                    size="sm" 
                                    flat 
                                    dense 
                                    label="Editar"
                                    @click="openEditDialog(item)"
                                />
                                <q-btn 
                                    icon="delete" 
                                    color="negative" 
                                    size="sm" 
                                    flat 
                                    dense 
                                    label="Eliminar"
                                    @click="confirmDelete(item)"
                                />
                            </q-card-actions>
                        </q-card>
                    </div>
                </div>
            </q-card-section>

            <!-- Empty state -->
            <q-card-section v-else class="text-center text-grey-7 q-py-xl">
                <q-icon name="inventory_2" size="64px" color="grey-5" class="q-mb-md"/>
                <div class="text-h6">No hay Ítems para mostrar</div>
                <div class="text-body2 q-mt-sm">
                    {{ categoriaFiltro || aulaFiltro || searchQuery 
                        ? 'Intenta cambiar los filtros de búsqueda' 
                        : 'Crea tu primer Ítem para comenzar' 
                    }}
                </div>
            </q-card-section>
        </q-card>

        <!-- Dialog crear/editar Ítem -->
        <q-dialog v-model="itemDialog" persistent>
            <q-card style="width: 600px; max-width: 95%;">
                <q-toolbar :class="isEditing ? 'bg-blue-8' : 'bg-primary'" class="text-white">
                    <q-icon name="inventory_2" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">
                        {{ isEditing ? 'Editar Ítem' : 'Crear Nuevo Ítem' }}
                    </q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>

                <q-card-section class="q-pt-md" style="max-height: 70vh; overflow-y: auto;">
                    <q-form @submit.prevent="submitItem" class="q-gutter-md">
                        <q-input 
                            v-model="itemForm.nombre"
                            label="Nombre del Ítem" 
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
                                <q-select
                                    v-model="itemForm.categoria"
                                    :options="categorias"
                                    option-value="_id"
                                    option-label="nombre"
                                    emit-value
                                    map-options
                                    label="Zona" 
                                    outlined 
                                    dense
                                    :rules="[val => !!val || 'La zona es obligatoria']"
                                >
                                    <template v-slot:prepend>
                                        <q-icon name="category" />
                                    </template>
                                </q-select>
                            </div>
                            <div class="col-12 col-sm-6">
                                <q-select
                                    v-model="itemForm.aula"
                                    :options="aulas"
                                    option-value="_id"
                                    option-label="nombre"
                                    emit-value
                                    map-options
                                    label="Aula" 
                                    outlined 
                                    dense
                                    :rules="[val => !!val || 'El aula es obligatoria']"
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
                                        val => val >= 0 || 'Debe ser mayor o igual a 0'
                                    ]"
                                >
                                    <template v-slot:prepend>
                                        <q-icon name="inventory" />
                                    </template>
                                </q-input>
                            </div>
                            <div class="col-12 col-sm-6">
                                <q-input 
                                    v-model.number="itemForm.cantidad_disponible"
                                    label="Cantidad Disponible" 
                                    type="number" 
                                    outlined 
                                    dense
                                    min="0"
                                    :max="itemForm.cantidad_total_stock"
                                    :rules="[
                                        val => val !== null && val !== '' || 'Obligatorio',
                                        val => val >= 0 || 'Debe ser mayor o igual a 0',
                                        val => val <= itemForm.cantidad_total_stock || 'No puede superar el total'
                                    ]"
                                >
                                    <template v-slot:prepend>
                                        <q-icon name="check_circle" />
                                    </template>
                                </q-input>
                            </div>
                        </div>

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

                        <!-- Sección de Imagen -->
                        <div class="q-mb-md">
                            <div class="text-subtitle2 q-mb-sm">Imagen del Ítem</div>
                            
                            <!-- Selector de método -->
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

                            <!-- Método Archivo -->
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

                                <!-- Zona de Drag & Drop -->
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
            hint="URL de la imagen del Ítem"
            @update:model-value="imagePreview = itemForm.imagen"
        >
            <template v-slot:prepend>
                <q-icon name="image" />
            </template>
        </q-input>
    </div>

                            <!-- Preview de imagen -->
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
                                :label="isEditing ? 'Guardar Cambios' : 'Crear Ítem'"
                                :color="isEditing ? 'blue-8' : 'primary'"
                                :icon="isEditing ? 'save' : 'add'"
                                :loading="submitting"
                            />
                        </q-card-actions>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>

        <!-- EstadÃ­sticas -->
        <div v-if="items.length > 0" class="q-mt-lg text-center">
            <q-chip icon="inventory_2" color="primary" text-color="white">
                {{ filteredItems.length }} Ítem(s)
            </q-chip>
            <q-chip icon="check_circle" color="positive" text-color="white">
                {{ disponiblesCount }} disponible(s)
            </q-chip>
            <q-chip icon="cancel" color="negative" text-color="white">
                {{ agotadosCount }} agotado(s)
            </q-chip>
        </div>
    
        <!-- Dialog de confirmación de eliminación -->
        <q-dialog v-model="deleteDialog" persistent>
            <q-card style="width: 90vw; max-width: 450px;">
                <q-card-section class="row items-center">
                    <q-avatar icon="delete" color="negative" text-color="white" />
                    <span class="q-ml-sm text-h6">Eliminar Ítem</span>
                </q-card-section>

                <q-card-section>
                    <div class="text-body1 q-mb-md">
                        ¿Estás seguro que deseas eliminar el ítem
                        <strong>"{{ itemToDelete?.nombre }}"</strong>?
                    </div>
                    <q-banner class="bg-negative-1 text-negative" rounded dense>
                        <template v-slot:avatar>
                            <q-icon name="warning" color="negative" />
                        </template>
                        Esta acción no se puede deshacer.
                    </q-banner>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="grey" v-close-popup />
                    <q-btn 
                        flat 
                        label="Eliminar" 
                        color="negative" 
                        icon="delete"
                        @click="deleteItem(itemToDelete)" 
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>

    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { itemsService, categoriesService, classroomsService } from '../../services/items.js';

const $q = useQuasar();
const router = useRouter();

// Estados reactivos
const items = ref([]);
const categorias = ref([]);
const aulas = ref([]);
const loading = ref(false);
const error = ref(null);

// Filtros
const categoriaFiltro = ref(null);
const aulaFiltro = ref(null);
const searchQuery = ref('');

// Dialog
const itemDialog = ref(false);
const selectedItem = ref(null);
const submitting = ref(false);

// Tipos de categoría (del modelo)
const tiposCategoria = [
    'Consumible',
    'Devolutivo',
    'Trasladado',
    'Placa SENA',
    'Herramienta de equipo',
    'Insumo',
    'De Uso Controlado'
];

// Dialog de confirmación de eliminación
const deleteDialog = ref(false);
const itemToDelete = ref(null);


const itemForm = ref({
    nombre: '',
    descripcion: '',
    categoria: null,
    aula: null,
    cantidad_total_stock: 0,
    cantidad_disponible: 0,
    imagen: '',
    tipo_categoria: ''
});

// Estado para manejo de imagen
const imagePreview = ref(null);
const imageFile = ref(null);
const uploadMethod = ref('file');

// Computed para saber si está¡ editando
const isEditing = computed(() => !!selectedItem.value);

// Computed para Í­tems filtrados
const filteredItems = computed(() => {
    let result = items.value;

    if (categoriaFiltro.value) {
        result = result.filter(item => item.categoria?._id === categoriaFiltro.value);
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

// Computed para estadí­sticas
const disponiblesCount = computed(() => 
    filteredItems.value.filter(item => item.estado === 'Disponible').length
);

const agotadosCount = computed(() => 
    filteredItems.value.filter(item => item.estado === 'Agotado').length
);

// Función para cargar datos iniciales
const loadInitialData = async () => {
    try {
        const [categoriasData, aulasData] = await Promise.all([
            categoriesService.getAll(),
            classroomsService.getAll()
        ]);
        
        categorias.value = categoriasData;
        aulas.value = aulasData;
    } catch (err) {
        console.error('Error cargando datos iniciales:', err);
    }
};

// Función para cargar Í­tems
const loadItems = async () => {
    loading.value = true;
    error.value = null;
    
    try {
        const data = await itemsService.getAll();
        items.value = data;
    } catch (err) {
        console.error('Error cargando Ítems:', err);
        error.value = 'Error al cargar los Ítems. Por favor, intenta nuevamente.';
        
        $q.notify({
            type: 'negative',
            message: 'No se pudieron cargar los Ítems',
            position: 'top',
            icon: 'error',
            timeout: 3000
        });
    } finally {
        loading.value = false;
    }
};

// Función para obtener color del stock
const getStockColor = (item) => {
    const percentage = (item.cantidad_disponible / item.cantidad_total_stock) * 100;
    if (percentage === 0) return 'negative';
    if (percentage < 30) return 'warning';
    if (percentage < 70) return 'info';
    return 'positive';
};

// Función para obtener clase de color del stock
const getStockColorClass = (item) => {
    const percentage = (item.cantidad_disponible / item.cantidad_total_stock) * 100;
    if (percentage === 0) return 'text-negative';
    if (percentage < 30) return 'text-warning';
    if (percentage < 70) return 'text-info';
    return 'text-positive';
};

// Función para abrir dialog de creación
const openCreateDialog = () => {
    selectedItem.value = null;
    itemForm.value = {
        nombre: '',
        descripcion: '',
        categoria: null,
        aula: null,
        cantidad_total_stock: 0,
        cantidad_disponible: 0,
        imagen: '',
        tipo_categoria: ''
    };
    imagePreview.value = null;
    imageFile.value = null;
    uploadMethod.value = 'file';
    itemDialog.value = true;
};

// Función para abrir dialog de edición
const openEditDialog = (item) => {
    selectedItem.value = item;
    itemForm.value = {
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        categoria: item.categoria?._id,
        aula: item.aula?._id,
        cantidad_total_stock: item.cantidad_total_stock,
        cantidad_disponible: item.cantidad_disponible,
        imagen: item.imagen || '',
        tipo_categoria: item.tipo_categoria
    };
    imagePreview.value = item.imagen || null;
    imageFile.value = null;
    uploadMethod.value = item.imagen ? 'file' : 'file';
    itemDialog.value = true;
};

// Función para manejar archivo de imagen
const handleImageFile = (file) => {
    if (!file) return;
    
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
        $q.notify({
            type: 'warning',
            message: 'Por favor selecciona un archivo de imagen válido',
            position: 'top',
            timeout: 2000
        });
        return;
    }
    
    // Validar tamaño (máx 5MB)
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
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
};

// Función para eliminar imagen
const removeImage = () => {
    imagePreview.value = null;
    imageFile.value = null;
    itemForm.value.imagen = '';
};

// Función para convertir imagen a base64
const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Función para enviar formulario
const submitItem = async () => {
    submitting.value = true;

    try {
        // Preparar datos del formulario
        const formData = { ...itemForm.value };
        
        // Si hay un archivo de imagen, convertirlo a base64
        if (imageFile.value && uploadMethod.value === 'file') {
            formData.imagen = await convertImageToBase64(imageFile.value);
        }

        if (isEditing.value) {
            await itemsService.update(selectedItem.value._id, formData);
            
            $q.notify({
                type: 'info',
                message: 'Ítem actualizado exitosamente',
                position: 'top',
                icon: 'upload',
                timeout: 2500
            });
        } else {
            await itemsService.create(formData);
            
            $q.notify({
                type: 'positive',
                message: 'Ítem creado exitosamente',
                position: 'top',
                icon: 'check_circle',
                timeout: 2500
            });
        }

        itemDialog.value = false;
        await loadItems();

    } catch (err) {
        console.error('Error al guardar Ítem:', err);
        
        const errorMessage = err.response?.data?.message || 'No se pudo guardar el Ítem';
        
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

// Función para confirmar eliminación
const confirmDelete = (item) => {
    itemToDelete.value = item;
    deleteDialog.value = true;
};


// Función para eliminar Ítem
const deleteItem = async (item) => {
    if (!itemToDelete.value) return;
    
    try {
        await itemsService.delete((item || itemToDelete.value)._id);

        $q.notify({
            type: 'warning',
            message: 'Ítem eliminado exitosamente',
            position: 'top',
            icon: 'report_problem',
            timeout: 2500
        });

        deleteDialog.value = false;
        itemToDelete.value = null;
        await loadItems();

    } catch (err) {
        console.error('Error al eliminar ítem:', err);
        
        const errorMessage = err.response?.data?.message || 'No se pudo eliminar el ítem';
        
        $q.notify({
            type: 'negative',
            message: errorMessage,
            position: 'top',
            icon: 'error',
            timeout: 4000
        });
    }
};


// Cargar datos al montar
onMounted(async () => {
    await loadInitialData();
    await loadItems();
});
</script>

<style scoped>
.bg-grey-2 {
    background-color: #f0f4f8;
}

.item-card {
    transition: all 0.3s ease;
}

.item-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.drag-drop-zone {
    border: 2px dashed #ccc;
    transition: all 0.3s ease;
}

.drag-drop-zone:hover {
    border-color: var(--q-primary);
    background-color: rgba(var(--q-primary-rgb), 0.05);
}
</style>