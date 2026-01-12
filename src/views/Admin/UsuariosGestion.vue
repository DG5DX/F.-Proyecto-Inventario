<template>
    <q-page class="q-pa-lg bg-grey-2">
        <!-- Header -->
        <div class="row items-center q-mb-md">
            <q-icon name="people" size="md" color="primary" class="q-mr-sm"/>
            <div class="text-h5 text-weight-bold text-dark">Gestión de Usuarios</div>
            <q-space />
            <q-btn 
                color="primary" 
                icon="refresh" 
                label="Actualizar" 
                flat 
                dense 
                @click="loadUsers"
                :loading="loading"
            />
        </div>

        <!-- Filtros -->
        <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-12 col-md-6">
                <q-input
                    v-model="searchQuery"
                    filled
                    placeholder="Buscar por nombre o email..."
                    clearable
                    bg-color="white"
                >
                    <template v-slot:prepend>
                        <q-icon name="search" />
                    </template>
                </q-input>
            </div>
            <div class="col-12 col-md-6">
                <q-select
                    v-model="rolFiltro"
                    filled
                    label="Filtrar por Rol"
                    :options="['Todos', 'Admin', 'Comun']"
                    clearable
                    bg-color="white"
                    color="primary"
                >
                    <template v-slot:prepend>
                        <q-icon name="filter_list" />
                    </template>
                </q-select>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading && !users.length" class="text-center q-py-xl">
            <q-spinner-dots size="64px" color="primary" />
            <div class="text-h6 text-grey-6 q-mt-md">Cargando usuarios...</div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="64px" color="negative" class="q-mb-md"/>
            <div class="text-h6 text-negative">{{ error }}</div>
            <q-btn 
                color="primary" 
                label="Reintentar" 
                @click="loadUsers" 
                class="q-mt-md"
            />
        </div>

        <!-- Card de usuarios -->
        <q-card v-else flat bordered class="q-mt-sm">
            <q-card-section class="row items-center">
                <div class="text-h6">Listado de Usuarios</div>
                <q-space />
                <q-btn 
                    color="primary" 
                    icon="person_add" 
                    label="Crear Nuevo Administrador" 
                    @click="openCreateDialog"
                />
            </q-card-section>

            <q-separator />

            <!-- Tabla de usuarios -->
            <q-card-section v-if="filteredUsers.length > 0">
                <q-table
                    :rows="filteredUsers"
                    :columns="columns"
                    row-key="_id"
                    :rows-per-page-options="[10, 25, 50]"
                    :loading="loading"
                    flat
                    bordered
                >
                    <template v-slot:body-cell-nombre="props">
                        <q-td :props="props">
                            <div class="row items-center no-wrap">
                                <q-avatar 
                                    :color="props.row.rol === 'Admin' ? 'primary' : 'grey'" 
                                    text-color="white" 
                                    size="40px"
                                >
                                    {{ getUserInitials(props.row.nombre) }}
                                </q-avatar>
                                <div class="q-ml-sm">
                                    <div class="text-weight-medium">{{ props.row.nombre }}</div>
                                    <div class="text-caption text-grey-6">{{ props.row.email }}</div>
                                </div>
                            </div>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-rol="props">
                        <q-td :props="props">
                            <q-badge 
                                :color="props.row.rol === 'Admin' ? 'primary' : 'grey'" 
                                :label="props.row.rol"
                                class="q-px-md q-py-xs"
                            >
                                <q-icon 
                                    :name="props.row.rol === 'Admin' ? 'admin_panel_settings' : 'person'" 
                                    size="xs" 
                                    class="q-mr-xs"
                                />
                            </q-badge>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-fecha="props">
                        <q-td :props="props">
                            <div class="text-caption">
                                {{ formatDate(props.row.createdAt) }}
                            </div>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-actions="props">
                        <q-td :props="props">
                            <q-btn 
                                v-if="props.row.rol === 'Comun'"
                                icon="upgrade" 
                                label="Promover a Admin" 
                                color="primary" 
                                size="sm" 
                                flat 
                                dense
                                @click="confirmPromote(props.row)"
                            >
                                <q-tooltip>Convertir en Administrador</q-tooltip>
                            </q-btn>
                            <q-btn 
                                v-else-if="props.row._id !== currentUserId"
                                icon="warning" 
                                label="Degradar" 
                                color="warning" 
                                size="sm" 
                                flat 
                                dense
                                @click="confirmDemote(props.row)"
                            >
                                <q-tooltip>Quitar permisos de Admin</q-tooltip>
                            </q-btn>
                            <q-chip 
                                v-else
                                color="info" 
                                text-color="white" 
                                size="sm"
                            >
                                Tú
                            </q-chip>
                        </q-td>
                    </template>
                </q-table>
            </q-card-section>

            <!-- Empty state -->
            <q-card-section v-else class="text-center text-grey-7 q-py-xl">
                <q-icon name="people" size="64px" color="grey-5" class="q-mb-md"/>
                <div class="text-h6">No se encontraron usuarios</div>
                <div class="text-body2 q-mt-sm">
                    Intenta ajustar los filtros de búsqueda
                </div>
            </q-card-section>
        </q-card>

        <!-- Dialog crear administrador -->
        <q-dialog v-model="createDialog" persistent>
            <q-card style="width: 500px; max-width: 95%;">
                <q-toolbar class="bg-primary text-white">
                    <q-icon name="person_add" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">
                        Crear Nuevo Administrador
                    </q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>

                <q-card-section>
                    <q-banner class="bg-blue-1 text-primary q-mb-md" rounded dense>
                        <template v-slot:avatar>
                            <q-icon name="info" color="primary" />
                        </template>
                        El nuevo administrador recibirá un email con sus credenciales de acceso.
                    </q-banner>

                    <q-form @submit.prevent="submitCreate" class="q-gutter-md">
                        <q-input 
                            v-model="createForm.nombre"
                            label="Nombre Completo" 
                            outlined 
                            dense
                            autofocus
                            counter
                            maxlength="100"
                            :rules="[
                                val => !!val || 'El nombre es obligatorio',
                                val => val.length >= 3 || 'Mínimo 3 caracteres'
                            ]"
                        >
                            <template v-slot:prepend>
                                <q-icon name="person" />
                            </template>
                        </q-input>

                        <q-input 
                            v-model="createForm.email"
                            label="Email" 
                            type="email"
                            outlined 
                            dense
                            counter
                            maxlength="350"
                            hint="Será usado para iniciar sesión"
                            :rules="[
                                val => !!val || 'El email es obligatorio',
                                val => /.+@.+\..+/.test(val) || 'Email inválido'
                            ]"
                        >
                            <template v-slot:prepend>
                                <q-icon name="email" />
                            </template>
                        </q-input>

                        <q-input 
                            v-model="createForm.password"
                            label="Contraseña" 
                            :type="showPassword ? 'text' : 'password'"
                            outlined 
                            dense
                            counter
                            hint="Mínimo 8 caracteres"
                            :rules="[
                                val => !!val || 'La contraseña es obligatoria',
                                val => val.length >= 8 || 'Mínimo 8 caracteres'
                            ]"
                        >
                            <template v-slot:prepend>
                                <q-icon name="lock" />
                            </template>
                            <template v-slot:append>
                                <q-icon
                                    :name="showPassword ? 'visibility_off' : 'visibility'"
                                    class="cursor-pointer"
                                    @click="showPassword = !showPassword"
                                />
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
                                label="Crear Administrador"
                                color="primary"
                                icon="person_add"
                                :loading="submitting"
                            />
                        </q-card-actions>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>

        <!-- Dialog promover a admin -->
        <q-dialog v-model="promoteDialog" persistent>
            <q-card style="width: 90vw; max-width: 450px;">
                <q-card-section class="row items-center">
                    <q-avatar icon="upgrade" color="primary" text-color="white" />
                    <span class="q-ml-sm text-h6">Promover a Administrador</span>
                </q-card-section>

                <q-card-section v-if="selectedUser">
                    ¿Estás seguro que deseas promover a <strong>{{ selectedUser.nombre }}</strong> 
                    a rol de Administrador?
                    
                    <q-banner class="bg-warning-1 text-warning q-mt-md" rounded dense>
                        <template v-slot:avatar>
                            <q-icon name="warning" color="warning" />
                        </template>
                        <strong>Atención:</strong> Tendrá acceso completo al sistema.
                    </q-banner>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="grey" v-close-popup />
                    <q-btn 
                        flat 
                        label="Promover" 
                        color="primary" 
                        icon="upgrade"
                        @click="promoteUser(selectedUser)" 
                        :loading="submitting"
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- Dialog degradar admin -->
        <q-dialog v-model="demoteDialog" persistent>
            <q-card style="width: 90vw; max-width: 450px;">
                <q-card-section class="row items-center">
                    <q-avatar icon="info" color="warning" text-color="white" />
                    <span class="q-ml-sm text-h6">Quitar Permisos de Admin</span>
                </q-card-section>

                <q-card-section v-if="selectedUser">
                    ¿Estás seguro que deseas quitar los permisos de administrador a 
                    <strong>{{ selectedUser.nombre }}</strong>?
                    
                    <q-banner class="bg-info-1 text-info q-mt-md" rounded dense>
                        <template v-slot:avatar>
                            <q-icon name="info" color="info" />
                        </template>
                        Volverá a ser un usuario común.
                    </q-banner>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="grey" v-close-popup />
                    <q-btn 
                        flat 
                        label="Degradar" 
                        color="warning" 
                        icon="warning"
                        @click="demoteUser(selectedUser)" 
                        :loading="submitting"
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- Estadísticas -->
        <div v-if="users.length > 0" class="q-mt-lg text-center">
            <q-chip icon="people" color="primary" text-color="white">
                {{ filteredUsers.length }} usuario(s)
            </q-chip>
            <q-chip icon="admin_panel_settings" color="primary" text-color="white">
                {{ adminCount }} administrador(es)
            </q-chip>
            <q-chip icon="person" color="grey" text-color="white">
                {{ commonCount }} usuario(s) común(es)
            </q-chip>
        </div>
    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import api from '../../services/api.js';
import { jwtDecode } from 'jwt-decode';

const $q = useQuasar();

// Estados reactivos
const users = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');
const rolFiltro = ref('Todos');

// Dialogs
const createDialog = ref(false);
const promoteDialog = ref(false);
const demoteDialog = ref(false);
const selectedUser = ref(null);
const submitting = ref(false);
const showPassword = ref(false);

// Formulario de creación
const createForm = ref({
    nombre: '',
    email: '',
    password: ''
});

// ID del usuario actual (para no permitir auto-degradarse)
const currentUserId = ref(null);

// Columnas de la tabla
const columns = [
    { 
        name: 'nombre', 
        required: true, 
        label: 'Usuario', 
        align: 'left', 
        field: 'nombre',
        sortable: true 
    },
    { 
        name: 'rol', 
        align: 'center', 
        label: 'Rol', 
        field: 'rol', 
        sortable: true 
    },
    { 
        name: 'fecha', 
        align: 'center', 
        label: 'Fecha de Registro', 
        field: 'createdAt', 
        sortable: true 
    },
    { 
        name: 'actions', 
        label: 'Acciones', 
        field: 'actions', 
        align: 'center' 
    }
];

// Computed para usuarios filtrados
const filteredUsers = computed(() => {
    let result = users.value;

    // Filtrar por rol
    if (rolFiltro.value && rolFiltro.value !== 'Todos') {
        result = result.filter(user => user.rol === rolFiltro.value);
    }

    // Filtrar por búsqueda
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(user => 
            user.nombre.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        );
    }

    return result;
});

// Computed para estadísticas
const adminCount = computed(() => 
    filteredUsers.value.filter(user => user.rol === 'Admin').length
);

const commonCount = computed(() => 
    filteredUsers.value.filter(user => user.rol === 'Comun').length
);

// Función para obtener el ID del usuario actual
const loadCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const decoded = jwtDecode(token);
            currentUserId.value = decoded.sub;
        } catch (err) {
            console.error('Error decodificando token:', err);
        }
    }
};

// Función para cargar usuarios
const loadUsers = async () => {
    loading.value = true;
    error.value = null;
    
    try {
        const { data } = await api.get('/users');
        users.value = data;
    } catch (err) {
        console.error('Error cargando usuarios:', err);
        error.value = 'Error al cargar los usuarios. Por favor, intenta nuevamente.';
        
        $q.notify({
            type: 'negative',
            message: 'No se pudieron cargar los usuarios',
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

// Función para obtener iniciales
const getUserInitials = (nombre) => {
    if (!nombre) return '?';
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Función para abrir dialog de creación
const openCreateDialog = () => {
    createForm.value = {
        nombre: '',
        email: '',
        password: ''
    };
    showPassword.value = false;
    createDialog.value = true;
};

// Función para crear administrador
const submitCreate = async () => {
    submitting.value = true;

    try {
        const payload = {
            ...createForm.value,
            rol: 'Admin' // Forzar rol Admin
        };

        await api.post('/users', payload);

        $q.notify({
            type: 'positive',
            message: 'Administrador creado exitosamente',
            position: 'top',
            icon: 'check_circle',
            timeout: 3000
        });

        createDialog.value = false;
        await loadUsers();

    } catch (err) {
        console.error('Error al crear administrador:', err);
        
        let errorMessage = 'No se pudo crear el administrador';
        
        if (err.response?.status === 409) {
            errorMessage = 'Ya existe un usuario con ese email';
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

// Función para confirmar promoción
const confirmPromote = (user) => {
    selectedUser.value = user;
    promoteDialog.value = true;
};

// Función para promover usuario
const promoteUser = async (user) => {
    if (!user) return;

    submitting.value = true;

    try {
        await api.patch(`/users/${user._id}/role`, { rol: 'Admin' });

        $q.notify({
            type: 'positive',
            message: `${user.nombre} ahora es Administrador`,
            position: 'top',
            icon: 'check_circle',
            timeout: 3000
        });

        promoteDialog.value = false;
        selectedUser.value = null;
        await loadUsers();

    } catch (err) {
        console.error('Error al promover usuario:', err);
        
        const errorMessage = err.response?.data?.message || 'No se pudo promover el usuario';
        
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

// Función para confirmar degradación
const confirmDemote = (user) => {
    selectedUser.value = user;
    demoteDialog.value = true;
};

// Función para degradar admin
const demoteUser = async (user) => {
    if (!user) return;

    submitting.value = true;

    try {
        await api.patch(`/users/${user._id}/role`, { rol: 'Comun' });

        $q.notify({
            type: 'info',
            message: `${user.nombre} ahora es Usuario Común`,
            position: 'top',
            icon: 'info',
            timeout: 3000
        });

        demoteDialog.value = false;
        selectedUser.value = null;
        await loadUsers();

    } catch (err) {
        console.error('Error al degradar usuario:', err);
        
        const errorMessage = err.response?.data?.message || 'No se pudo cambiar el rol del usuario';
        
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

// Cargar usuarios al montar
onMounted(() => {
    loadCurrentUserId();
    loadUsers();
});
</script>

<style scoped>
.bg-grey-2 {
    background-color: #f0f4f8;
}

.bg-warning-1 {
    background-color: #fff4e5;
}

.text-warning {
    color: #f57c00;
}

.bg-info-1 {
    background-color: #e3f2fd;
}

.text-info {
    color: #0277bd;
}
</style>