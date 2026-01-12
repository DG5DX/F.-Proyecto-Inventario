<template>
    <q-page class="q-pa-lg bg-grey-2">
        <!-- Header -->
        <div class="row items-center q-mb-md">
            <q-btn 
                icon="arrow_back" 
                flat 
                round 
                dense 
                color="primary" 
                class="q-mr-sm" 
                @click="router.push({ name: 'admin.zones' })"
            >
                <q-tooltip>Volver a Zonas</q-tooltip>
            </q-btn>
            <q-icon name="meeting_room" size="md" color="secondary" class="q-mr-sm" />
            <div class="text-h5 text-weight-bold text-dark">
                Gestión de Aulas
            </div>
            <q-space />
            <q-btn 
                color="secondary" 
                icon="refresh" 
                label="Actualizar" 
                flat 
                dense 
                @click="loadClassrooms"
                :loading="loading"
            />
        </div>

        <!-- Loading State -->
        <div v-if="loading && !classrooms.length" class="text-center q-py-xl">
            <q-spinner-dots size="64px" color="secondary" />
            <div class="text-h6 text-grey-6 q-mt-md">Cargando aulas...</div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="64px" color="negative" class="q-mb-md"/>
            <div class="text-h6 text-negative">{{ error }}</div>
            <q-btn 
                color="primary" 
                label="Reintentar" 
                @click="loadClassrooms" 
                class="q-mt-md"
            />
        </div>

        <!-- Card de aulas -->
        <q-card v-else flat bordered class="q-mt-sm">
            <q-card-section class="row items-center">
                <div class="text-h6">Listado de Aulas</div>
                <q-space/>
                <q-btn 
                    color="secondary" 
                    icon="add" 
                    label="Crear Nueva Aula" 
                    @click="openCreateDialog"
                />
            </q-card-section>

            <q-separator />

            <!-- Lista de aulas -->
            <q-list v-if="classrooms.length > 0" separator>
                <q-item 
                    v-for="classroom in classrooms" 
                    :key="classroom._id"
                    clickable 
                    v-ripple
                >
                    <q-item-section avatar>
                        <q-avatar 
                            color="secondary" 
                            text-color="white" 
                            icon="meeting_room"
                        />
                    </q-item-section>

                    <q-item-section>
                        <q-item-label class="text-weight-bold text-h6">
                            {{ classroom.nombre }}
                        </q-item-label>
                        <q-item-label caption class="text-body2 ellipsis-2-lines">
                            {{ classroom.descripcion || 'Sin descripción' }}
                        </q-item-label>
                        <q-item-label caption class="text-grey-6 q-mt-xs">
                            Creado: {{ formatDate(classroom.createdAt) }}
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
                                @click="openEditDialog(classroom)"
                            >
                                <q-tooltip>Editar Aula</q-tooltip>
                            </q-btn>
                            <q-btn 
                                icon="delete" 
                                color="negative" 
                                size="sm" 
                                flat 
                                dense
                                @click="confirmDelete(classroom)"
                            >
                                <q-tooltip>Eliminar Aula</q-tooltip>
                            </q-btn>
                        </div>
                    </q-item-section>
                </q-item>
            </q-list>

            <!-- Empty state -->
            <q-item v-else>
                <q-item-section class="text-center text-grey-7 q-py-lg">
                    <q-icon name="meeting_room" size="64px" color="grey-5" class="q-mb-md"/>
                    <div class="text-h6">No hay aulas registradas</div>
                    <div class="text-body2 q-mt-sm">
                        Crea tu primera aula para comenzar a organizar el inventario
                    </div>
                </q-item-section>
            </q-item>
        </q-card>

        <!-- Dialog crear/editar aula -->
        <q-dialog v-model="classroomDialog" persistent>
            <q-card style="width: 450px; max-width: 95%;">
                <q-toolbar :class="isEditing ? 'bg-blue-8' : 'bg-secondary'" class="text-white">
                    <q-icon name="meeting_room" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">
                        {{ isEditing ? 'Editar Aula' : 'Crear Nueva Aula' }}
                    </q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>

                <q-card-section>
                    <q-form @submit.prevent="submitClassroom" class="q-gutter-md">
                        <q-input 
                            v-model="classroomForm.nombre"
                            label="Nombre del Aula" 
                            outlined 
                            dense
                            autofocus
                            counter
                            maxlength="150"
                            hint="Ej: Aula 1, Laboratorio A, Sala de Conferencias"
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
                            v-model="classroomForm.descripcion"
                            label="Descripción del Aula" 
                            type="textarea" 
                            rows="3" 
                            outlined 
                            dense
                            counter
                            maxlength="500"
                            hint="Describe la ubicación o características del aula"
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
                                :label="isEditing ? 'Guardar Cambios' : 'Crear Aula'"
                                :color="isEditing ? 'blue-8' : 'secondary'"
                                :icon="isEditing ? 'save' : 'add'"
                                :loading="submitting"
                            />
                        </q-card-actions>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>

        <!-- EstadÃ­sticas -->
        <div v-if="classrooms.length > 0" class="q-mt-lg text-center">
            <q-chip icon="meeting_room" color="secondary" text-color="white">
                {{ classrooms.length }} aula(s) registrada(s)
            </q-chip>
        </div>
    
        <!-- Dialog de confirmación de eliminación -->
        <q-dialog v-model="deleteDialog" persistent>
            <q-card style="width: 90vw; max-width: 450px;">
                <q-card-section class="row items-center">
                    <q-avatar icon="delete" color="negative" text-color="white" />
                    <span class="q-ml-sm text-h6">Eliminar Aula</span>
                </q-card-section>

                <q-card-section>
                    <div class="text-body1 q-mb-md">
                        ¿Estás seguro que deseas eliminar el aula
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
                        @click="deleteClassroom(itemToDelete)" 
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>

    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter, useRoute } from 'vue-router';
import { classroomsService } from '../../services/items.js';

const $q = useQuasar();
const router = useRouter();
const route = useRoute();

// Estados reactivos
const classrooms = ref([]);
const loading = ref(false);
const error = ref(null);

// Dialog
const classroomDialog = ref(false);
const selectedClassroom = ref(null);
const submitting = ref(false);
const classroomForm = ref({
    nombre: '',
    descripcion: ''
});

// Dialog de confirmación de eliminación
const deleteDialog = ref(false);
const itemToDelete = ref(null);


// Computed para saber si está editando
const isEditing = computed(() => !!selectedClassroom.value);

// Función para cargar aulas
const loadClassrooms = async () => {
    loading.value = true;
    error.value = null;
    
    try {
        const data = await classroomsService.getAll();
        classrooms.value = data;
    } catch (err) {
        console.error('Error cargando aulas:', err);
        error.value = 'Error al cargar las aulas. Por favor, intenta nuevamente.';
        
        $q.notify({
            type: 'negative',
            message: 'No se pudieron cargar las aulas',
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
    selectedClassroom.value = null;
    classroomForm.value = {
        nombre: '',
        descripcion: ''
    };
    classroomDialog.value = true;
};

// Función para abrir dialog de edición
const openEditDialog = (classroom) => {
    selectedClassroom.value = classroom;
    classroomForm.value = {
        nombre: classroom.nombre,
        descripcion: classroom.descripcion || ''
    };
    classroomDialog.value = true;
};

// Función para enviar formulario (crear o editar)
const submitClassroom = async () => {
    submitting.value = true;

    try {
        if (isEditing.value) {
            // Actualizar aula existente
            await classroomsService.update(selectedClassroom.value._id, classroomForm.value);
            
            $q.notify({
                type: 'info',
                message: 'Aula actualizada exitosamente',
                position: 'top',
                icon: 'upload',
                timeout: 2500
            });
        } else {
            // Crear nueva aula
            await classroomsService.create(classroomForm.value);
            
            $q.notify({
                type: 'positive',
                message: 'Aula creada exitosamente',
                position: 'top',
                icon: 'check_circle',
                timeout: 2500
            });
        }

        classroomDialog.value = false;
        await loadClassrooms();

    } catch (err) {
        console.error('Error al guardar aula:', err);
        
        let errorMessage = 'No se pudo guardar el aula';
        
        // Manejar error de nombre duplicado
        if (err.response?.status === 409 || err.response?.data?.message?.includes('duplicate')) {
            errorMessage = 'Ya existe un aula con ese nombre';
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


// Función para eliminar aula
const deleteClassroom = async (classroom) => {
    if (!itemToDelete.value) return;
    
    try {
        await classroomsService.delete(itemToDelete.value._id);

        $q.notify({
            type: 'warning',
            message: 'Aula eliminada exitosamente',
            position: 'top',
            icon: 'report_problem',
            timeout: 2500
        });

        deleteDialog.value = false;
        itemToDelete.value = null;
        await loadClassrooms();

    } catch (err) {
        console.error('Error al eliminar:', err);
        
        let errorMessage = 'No se pudo eliminar el aula';
        
        if (err.response?.status === 409) {
            errorMessage = 'No se puede eliminar esta aula porque tiene ítems asociados';
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


// Cargar aulas al montar
onMounted(() => {
    loadClassrooms();
});
</script>

<style scoped>
.bg-grey-2 {
    background-color: #f0f4f8;
}

.ellipsis-2-lines {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.4em;
    max-height: 2.8em;
}
</style>