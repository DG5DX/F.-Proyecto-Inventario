<template>
    <q-page class="q-pa-lg bg-grey-2">
        <!-- Header -->
        <div class="row items-center q-mb-md">
            <q-icon name="category" size="md" color="primary" class="q-mr-sm"/>
            <div class="text-h5 text-weight-bold text-dark">Gestión de Zonas (Categorías)</div>
            <q-space />
            <q-btn 
                color="primary" 
                icon="refresh" 
                label="Actualizar" 
                flat 
                dense 
                @click="loadZones"
                :loading="loading"
            />
        </div>

        <!-- Loading State -->
        <div v-if="loading && !zones.length" class="text-center q-py-xl">
            <q-spinner-dots size="64px" color="primary" />
            <div class="text-h6 text-grey-6 q-mt-md">Cargando zonas...</div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="64px" color="negative" class="q-mb-md"/>
            <div class="text-h6 text-negative">{{ error }}</div>
            <q-btn 
                color="primary" 
                label="Reintentar" 
                @click="loadZones" 
                class="q-mt-md"
            />
        </div>

        <!-- Card de zonas -->
        <q-card v-else flat bordered class="q-mt-sm">
            <q-card-section class="row items-center">
                <div class="text-h6">Listado de Zonas</div>
                <q-space />
                <q-btn 
                    color="primary" 
                    icon="add" 
                    label="Crear Nueva Zona" 
                    @click="openCreateDialog"
                />
            </q-card-section>

            <q-separator />

            <!-- Lista de zonas -->
            <q-list v-if="zones.length > 0" separator>
                <q-item 
                    v-for="zone in zones" 
                    :key="zone._id"
                    clickable 
                    v-ripple
                >
                    <q-item-section avatar>
                        <q-avatar 
                            color="primary" 
                            text-color="white" 
                            icon="category"
                        />
                    </q-item-section>

                    <q-item-section>
                        <q-item-label class="text-weight-bold text-h6">
                            {{ zone.nombre }}
                        </q-item-label>
                        <q-item-label caption class="text-body2">
                            {{ zone.descripcion || 'Sin descripciÃ³n' }}
                        </q-item-label>
                        <q-item-label caption class="text-grey-6 q-mt-xs">
                            Creado: {{ formatDate(zone.createdAt) }}
                        </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                        <div class="row items-center q-gutter-x-sm">
                            <q-btn 
                                icon="edit" 
                                color="blue-8" 
                                size="sm" 
                                flat 
                                dense
                                @click="openEditDialog(zone)"
                            >
                                <q-tooltip>Editar Zona</q-tooltip>
                            </q-btn>
                            <q-btn 
                                icon="delete" 
                                color="negative" 
                                size="sm" 
                                flat 
                                dense
                                @click="confirmDelete(zone)"
                            >
                                <q-tooltip>Eliminar Zona</q-tooltip>
                            </q-btn>
                        </div>
                    </q-item-section>
                </q-item>
            </q-list>

            <!-- Empty state -->
            <q-item v-else>
                <q-item-section class="text-center text-grey-7 q-py-lg">
                    <q-icon name="category" size="64px" color="grey-5" class="q-mb-md"/>
                    <div class="text-h6">No hay zonas registradas</div>
                    <div class="text-body2 q-mt-sm">
                        Crea tu primera zona para comenzar a organizar el inventario
                    </div>
                </q-item-section>
            </q-item>
        </q-card>

        <!-- Dialog crear/editar zona -->
        <q-dialog v-model="zoneDialog" persistent>
            <q-card style="width: 450px; max-width: 95%;">
                <q-toolbar :class="isEditing ? 'bg-blue-8' : 'bg-primary'" class="text-white">
                    <q-icon name="category" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">
                        {{ isEditing ? 'Editar Zona' : 'Crear Nueva Zona' }}
                    </q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>

                <q-card-section>
                    <q-form @submit.prevent="submitZone" class="q-gutter-md">
                        <q-input 
                            v-model="zoneForm.nombre"
                            label="Nombre de la Zona" 
                            outlined 
                            dense
                            autofocus
                            counter
                            maxlength="150"
                            :rules="[
                                val => !!val || 'El nombre es obligatorio',
                                val => val.length >= 3 || 'Mínimo 3 caracteres',
                                val => val.length <= 150 || 'Máximo 150 caracteres'
                            ]"
                        >
                            <template v-slot:prepend>
                                <q-icon name="label" />
                            </template>
                        </q-input>

                        <q-input 
                            v-model="zoneForm.descripcion"
                            label="Descripción de la Zona" 
                            type="textarea" 
                            rows="3" 
                            outlined 
                            dense
                            counter
                            maxlength="500"
                            hint="Describe el tipo de Ítems o equipos de esta zona"
                            :rules="[
                                val => !val || val.length <= 500 || 'Máximo 500 caracteres'
                            ]"
                        >
                            <template v-slot:prepend>
                                <q-icon name="description" />
                            </template>
                        </q-input>

                        <q-card-actions align="right" class="q-mt-lg q-pb-none">
                            <q-btn 
                                flat 
                                label="Cancelar" 
                                color="grey" 
                                v-close-popup
                            />
                            <q-btn 
                                type="submit" 
                                :label="isEditing ? 'Guardar Cambios' : 'Crear Zona'"
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
        <div v-if="zones.length > 0" class="q-mt-lg text-center">
            <q-chip icon="category" color="primary" text-color="white">
                {{ zones.length }} zona(s) registrada(s)
            </q-chip>
        </div>
    
        <!-- Dialog de confirmación de eliminación -->
        <q-dialog v-model="deleteDialog" persistent>
            <q-card style="width: 90vw; max-width: 450px;">
                <q-card-section class="row items-center">
                    <q-avatar icon="delete" color="negative" text-color="white" />
                    <span class="q-ml-sm text-h6">Eliminar Zona</span>
                </q-card-section>

                <q-card-section>
                    <div class="text-body1 q-mb-md">
                        ¿Estás seguro que deseas eliminar la zona
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
                        @click="deleteZone(itemToDelete)" 
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
import { categoriesService } from '../../services/items.js';

const $q = useQuasar();
const router = useRouter();

// Estados reactivos
const zones = ref([]);
const loading = ref(false);
const error = ref(null);

// Dialog
const zoneDialog = ref(false);
const selectedZone = ref(null);
const submitting = ref(false);
const zoneForm = ref({
    nombre: '',
    descripcion: ''
});

// Dialog de confirmación de eliminación
const deleteDialog = ref(false);
const itemToDelete = ref(null);


// Computed para saber si está editando
const isEditing = computed(() => !!selectedZone.value);

// Función para cargar zonas
const loadZones = async () => {
    loading.value = true;
    error.value = null;
    
    try {
        const data = await categoriesService.getAll();
        zones.value = data;
    } catch (err) {
        console.error('Error cargando zonas:', err);
        error.value = 'Error al cargar las zonas. Por favor, intenta nuevamente.';
        
        $q.notify({
            type: 'negative',
            message: 'No se pudieron cargar las zonas',
            position: 'top',
            icon: 'error',
            timeout: 3000
        });
    } finally {
        loading.value = false;
    }
};

// Función para formatear fechas
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Función para abrir dialog de creación
const openCreateDialog = () => {
    selectedZone.value = null;
    zoneForm.value = {
        nombre: '',
        descripcion: ''
    };
    zoneDialog.value = true;
};

// Función para abrir dialog de edición
const openEditDialog = (zone) => {
    selectedZone.value = zone;
    zoneForm.value = {
        nombre: zone.nombre,
        descripcion: zone.descripcion || ''
    };
    zoneDialog.value = true;
};

// Función para enviar formulario (crear o editar)
const submitZone = async () => {
    submitting.value = true;

    try {
        if (isEditing.value) {
            // Actualizar zona existente
            await categoriesService.update(selectedZone.value._id, zoneForm.value);
            
            $q.notify({
                type: 'info',
                message: 'Zona actualizada exitosamente',
                position: 'top',
                icon: 'upload',
                timeout: 2500
            });
        } else {
            // Crear nueva zona
            await categoriesService.create(zoneForm.value);
            
            $q.notify({
                type: 'positive',
                message: 'Zona creada exitosamente',
                position: 'top',
                icon: 'check_circle',
                timeout: 2500
            });
        }

        zoneDialog.value = false;
        await loadZones();

    } catch (err) {
        console.error('Error al guardar zona:', err);
        
        let errorMessage = 'No se pudo guardar la zona';
        
        // Manejar error de nombre duplicado
        if (err.response?.status === 409 || err.response?.data?.message?.includes('duplicate')) {
            errorMessage = 'Ya existe una zona con ese nombre';
        } else if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
        }
        
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


// Función para eliminar zona
const deleteZone = async (zone) => {
    if (!itemToDelete.value) return;
    
    try {
        await categoriesService.delete((zone || itemToDelete.value)._id);

        $q.notify({
            type: 'warning',
            message: 'Zona eliminada exitosamente',
            position: 'top',
            icon: 'report_problem',
            timeout: 2500
        });

        deleteDialog.value = false;
        itemToDelete.value = null;
        await loadZones();

    } catch (err) {
        console.error('Error al eliminar zona:', err);
        
        let errorMessage = 'No se pudo eliminar la zona';
        
        if (err.response?.status === 409) {
            errorMessage = 'No se puede eliminar esta zona porque tiene ítems asociados';
        } else if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
        }
        
        $q.notify({
            type: 'negative',
            message: errorMessage,
            position: 'top',
            icon: 'error',
            timeout: 4000
        });
    }
};


// Cargar zonas al montar
onMounted(() => {
    loadZones();
});
</script>

<style scoped>
.bg-grey-2 {
    background-color: #f0f4f8;
}
</style>