<template>
    <q-page class="q-pa-lg bg-grey-2">
        <div class="row items-center q-mb-md">
            <q-icon name="people" size="md" color="primary" class="q-mr-sm"/>
            <div class="text-h5 text-weight-bold text-dark">Gestión de Usuarios</div>
            <q-space />
            <q-btn color="primary" icon="refresh" label="Actualizar" flat dense @click="loadUsers" :loading="loading"/>
        </div>

        <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-12 col-md-6">
                <q-input v-model="searchQuery" filled placeholder="Buscar por nombre o email..." clearable bg-color="white">
                    <template v-slot:prepend><q-icon name="search" /></template>
                </q-input>
            </div>
            <div class="col-12 col-md-6">
                <q-select v-model="rolFiltro" filled label="Filtrar por Rol"
                    :options="['Todos', 'SuperAdmin', 'Admin', 'Comun']"
                    clearable bg-color="white" color="primary">
                    <template v-slot:prepend><q-icon name="filter_list" /></template>
                </q-select>
            </div>
        </div>

        <div v-if="loading && !users.length" class="text-center q-py-xl">
            <q-spinner-dots size="64px" color="primary" />
            <div class="text-h6 text-grey-6 q-mt-md">Cargando usuarios...</div>
        </div>

        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="64px" color="negative" class="q-mb-md"/>
            <div class="text-h6 text-negative">{{ error }}</div>
            <q-btn color="primary" label="Reintentar" @click="loadUsers" class="q-mt-md"/>
        </div>

        <q-card v-else flat bordered class="q-mt-sm">
            <q-card-section class="row items-center">
                <div class="text-h6">Listado de Usuarios</div>
                <q-space />
                <q-btn v-if="currentUserRol === 'SuperAdmin'"
                    color="primary" icon="person_add" label="Crear Nuevo Administrador"
                    @click="openCreateDialog"/>
            </q-card-section>

            <q-separator />

            <q-card-section v-if="filteredUsers.length > 0">
                <q-table :rows="filteredUsers" :columns="columns" row-key="_id"
                    :rows-per-page-options="[10, 25, 50]" :loading="loading" flat bordered>

                    <template v-slot:body-cell-nombre="props">
                        <q-td :props="props">
                            <div class="row items-center no-wrap">
                                <q-avatar :color="getRolColor(props.row.rol)" text-color="white" size="40px">
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
                            <q-badge :color="getRolColor(props.row.rol)" :label="props.row.rol" class="q-px-md q-py-xs">
                                <q-icon :name="getRolIcon(props.row.rol)" size="xs" class="q-mr-xs" />
                            </q-badge>
                        </q-td>
                    </template>

                    <!-- Columna de ambientes asignados (solo para Admins) -->
                    <template v-slot:body-cell-ambientes="props">
                        <q-td :props="props">
                            <div v-if="props.row.rol === 'Admin'">
                                <div v-if="props.row.ambientes_asignados?.length > 0">
                                    <q-chip
                                        v-for="amb in props.row.ambientes_asignados"
                                        :key="amb._id"
                                        dense square
                                        color="teal-1" text-color="teal-9"
                                        icon="meeting_room"
                                        class="q-mr-xs q-mb-xs"
                                        size="sm"
                                    >
                                        {{ amb.nombre }}
                                    </q-chip>
                                </div>
                                <span v-else class="text-caption text-negative text-weight-medium">
                                    <q-icon name="warning" size="xs" class="q-mr-xs"/>Sin ambientes asignados
                                </span>
                            </div>
                            <span v-else class="text-caption text-grey-5">—</span>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-fecha="props">
                        <q-td :props="props">
                            <div class="text-caption">{{ formatDate(props.row.createdAt) }}</div>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-actions="props">
                        <q-td :props="props">
                            <q-chip v-if="props.row._id === currentUserId" color="info" text-color="white" size="sm">Tú</q-chip>

                            <span v-else-if="props.row.rol === 'SuperAdmin'">
                                <q-chip color="deep-purple" text-color="white" size="sm" icon="shield">Super Admin</q-chip>
                            </span>

                            <div v-else class="row no-wrap items-center" style="gap:4px;">
                                <!-- Asignar ambientes (solo Admin) -->
                                <q-btn v-if="currentUserRol === 'SuperAdmin' && props.row.rol === 'Admin'"
                                    icon="meeting_room" color="teal" size="sm" flat dense
                                    @click="openAmbientesDialog(props.row)">
                                    <q-tooltip>Asignar ambientes a este administrador</q-tooltip>
                                </q-btn>

                                <!-- Promover / Degradar -->
                                <q-btn v-if="currentUserRol === 'SuperAdmin' && props.row.rol === 'Admin'"
                                    icon="warning" label="Degradar" color="warning" size="sm" flat dense
                                    @click="confirmDemote(props.row)">
                                    <q-tooltip>Quitar permisos de Administrador</q-tooltip>
                                </q-btn>
                                <q-btn v-else-if="currentUserRol === 'SuperAdmin' && props.row.rol === 'Comun'"
                                    icon="upgrade" label="Promover a Admin" color="primary" size="sm" flat dense
                                    @click="confirmPromote(props.row)">
                                    <q-tooltip>Convertir en Administrador</q-tooltip>
                                </q-btn>
                                <q-chip v-else color="grey-4" text-color="grey-7" size="sm">Sin acceso</q-chip>
                            </div>
                        </q-td>
                    </template>
                </q-table>
            </q-card-section>

            <q-card-section v-else class="text-center text-grey-7 q-py-xl">
                <q-icon name="people" size="64px" color="grey-5" class="q-mb-md"/>
                <div class="text-h6">No se encontraron usuarios</div>
            </q-card-section>
        </q-card>

        <!-- ── Dialog: Asignar Ambientes ─────────────────────────────────────── -->
        <q-dialog v-model="ambientesDialog" persistent>
            <q-card style="width: 600px; max-width: 97vw;">
                <q-toolbar class="bg-teal text-white">
                    <q-icon name="meeting_room" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">
                        Ambientes de {{ selectedUser?.nombre }}
                    </q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup :disable="savingAmbientes"/>
                </q-toolbar>

                <q-card-section class="q-pt-md">
                    <q-banner class="bg-teal-1 text-teal-9 q-mb-md" rounded dense>
                        <template v-slot:avatar><q-icon name="info" color="teal"/></template>
                        <div class="text-caption">
                            Selecciona los ambientes que este administrador puede gestionar.
                            Podrá <strong>crear, editar y eliminar ítems</strong> solo en estos ambientes,
                            y <strong>aprobar/rechazar solicitudes</strong> que contengan ítems de ellos.
                        </div>
                    </q-banner>

                    <div v-if="loadingAmbientes" class="text-center q-py-md">
                        <q-spinner-dots size="40px" color="teal"/>
                    </div>

                    <template v-else>
                        <!-- Filtro por sede -->
                        <q-select v-model="zonaFiltroAmbientes" :options="zonasOptions"
                            option-value="_id" option-label="nombre"
                            emit-value map-options clearable
                            label="Filtrar por sede" outlined dense class="q-mb-md"
                            bg-color="white">
                            <template v-slot:prepend><q-icon name="category" color="teal"/></template>
                        </q-select>

                        <div class="text-caption text-grey-6 q-mb-sm">
                            {{ selectedAmbientes.length }} ambiente(s) seleccionado(s)
                        </div>

                        <div v-if="filteredAmbientesOptions.length === 0" class="text-center q-py-md text-grey-6">
                            <q-icon name="meeting_room" size="40px" color="grey-4"/>
                            <div class="q-mt-sm">No hay ambientes registrados</div>
                        </div>

                        <q-list v-else bordered separator class="rounded-borders">
                            <q-item v-for="aula in filteredAmbientesOptions" :key="aula._id"
                                clickable @click="toggleAmbiente(aula._id)" dense>
                                <q-item-section avatar>
                                    <q-checkbox :model-value="selectedAmbientes.includes(aula._id)"
                                        @update:model-value="toggleAmbiente(aula._id)"
                                        color="teal"/>
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label class="text-weight-medium">{{ aula.nombre }}</q-item-label>
                                    <q-item-label caption>
                                        <q-icon name="category" size="xs" class="q-mr-xs"/>
                                        {{ aula.zona?.nombre || '—' }}
                                    </q-item-label>
                                </q-item-section>
                                <q-item-section side>
                                    <q-badge v-if="selectedAmbientes.includes(aula._id)"
                                        color="teal" label="Asignado" style="font-size:10px;"/>
                                </q-item-section>
                            </q-item>
                        </q-list>

                        <div class="row q-mt-sm q-gutter-xs">
                            <q-btn flat dense no-caps size="sm" color="teal" icon="select_all"
                                label="Seleccionar todos" @click="selectAllAmbientes"/>
                            <q-btn flat dense no-caps size="sm" color="grey" icon="deselect"
                                label="Limpiar selección" @click="selectedAmbientes = []"/>
                        </div>
                    </template>
                </q-card-section>

                <q-card-actions align="right" class="q-px-md q-pb-md">
                    <q-btn flat label="Cancelar" color="grey" v-close-popup :disable="savingAmbientes"/>
                    <q-btn unelevated label="Guardar asignación" color="teal" icon="save"
                        :loading="savingAmbientes" @click="saveAmbientes"/>
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- ── Dialog: Crear Admin ─────────────────────────────────────────── -->
        <q-dialog v-model="createDialog" persistent>
            <q-card style="width: 500px; max-width: 95%;">
                <q-toolbar class="bg-primary text-white">
                    <q-icon name="person_add" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">Crear Nuevo Administrador</q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>
                <q-card-section>
                    <q-banner class="bg-green-1 text-primary q-mb-md" rounded dense>
                        <template v-slot:avatar><q-icon name="info" color="primary" /></template>
                        El nuevo administrador recibirá un email con sus credenciales de acceso.
                    </q-banner>
                    <q-form @submit.prevent="submitCreate" class="q-gutter-md">
                        <q-input v-model="createForm.nombre" label="Nombre Completo" outlined dense autofocus counter maxlength="100"
                            :rules="[val => !!val || 'Obligatorio', val => val.length >= 3 || 'Mínimo 3 caracteres']">
                            <template v-slot:prepend><q-icon name="person" /></template>
                        </q-input>
                        <q-input v-model="createForm.email" label="Email" type="email" outlined dense counter maxlength="350"
                            :rules="[val => !!val || 'Obligatorio', val => /.+@.+\..+/.test(val) || 'Email inválido']">
                            <template v-slot:prepend><q-icon name="email" /></template>
                        </q-input>
                        <q-input v-model="createForm.password" label="Contraseña"
                            :type="showPassword ? 'text' : 'password'" outlined dense counter
                            :rules="[val => !!val || 'Obligatorio', val => val.length >= 8 || 'Mínimo 8 caracteres']">
                            <template v-slot:prepend><q-icon name="lock" /></template>
                            <template v-slot:append>
                                <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showPassword = !showPassword"/>
                            </template>
                        </q-input>
                        <q-card-actions align="right" class="q-mt-lg q-pb-none">
                            <q-btn flat label="Cancelar" color="grey" v-close-popup/>
                            <q-btn type="submit" label="Crear Administrador" color="primary" icon="person_add" :loading="submitting"/>
                        </q-card-actions>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>

        <!-- ── Dialogs Promover / Degradar ─────────────────────────────────── -->
        <q-dialog v-model="promoteDialog" persistent>
            <q-card style="width: 90vw; max-width: 450px;">
                <q-card-section class="row items-center">
                    <q-avatar icon="upgrade" color="primary" text-color="white" />
                    <span class="q-ml-sm text-h6">Promover a Administrador</span>
                </q-card-section>
                <q-card-section v-if="selectedUser">
                    ¿Promover a <strong>{{ selectedUser.nombre }}</strong> como Administrador?
                    <q-banner class="bg-warning-1 text-warning q-mt-md" rounded dense>
                        <template v-slot:avatar><q-icon name="warning" color="warning" /></template>
                        Podrá gestionar ítems de los ambientes que le asignes después.
                    </q-banner>
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="grey" v-close-popup />
                    <q-btn flat label="Promover" color="primary" icon="upgrade" @click="promoteUser(selectedUser)" :loading="submitting"/>
                </q-card-actions>
            </q-card>
        </q-dialog>

        <q-dialog v-model="demoteDialog" persistent>
            <q-card style="width: 90vw; max-width: 450px;">
                <q-card-section class="row items-center">
                    <q-avatar icon="info" color="warning" text-color="white" />
                    <span class="q-ml-sm text-h6">Quitar Permisos de Admin</span>
                </q-card-section>
                <q-card-section v-if="selectedUser">
                    ¿Quitar los permisos de administrador a <strong>{{ selectedUser.nombre }}</strong>?
                    <q-banner class="bg-orange-1 text-orange-9 q-mt-md" rounded dense>
                        <template v-slot:avatar><q-icon name="warning" color="orange"/></template>
                        Se eliminarán también sus ambientes asignados.
                    </q-banner>
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="grey" v-close-popup />
                    <q-btn flat label="Degradar" color="warning" icon="warning" @click="demoteUser(selectedUser)" :loading="submitting"/>
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- Estadísticas -->
        <div v-if="users.length > 0" class="q-mt-lg text-center">
            <q-chip icon="people" color="primary" text-color="white">{{ filteredUsers.length }} usuario(s)</q-chip>
            <q-chip icon="admin_panel_settings" color="primary" text-color="white">{{ adminCount }} admin(s)</q-chip>
            <q-chip icon="shield" color="deep-purple" text-color="white">{{ superAdminCount }} super admin(s)</q-chip>
            <q-chip icon="person" color="grey" text-color="white">{{ commonCount }} común(es)</q-chip>
        </div>
    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import api from '../../services/api.js';
import { classroomsService, zonesService } from '../../services/items.js';
import { jwtDecode } from 'jwt-decode';

const $q = useQuasar();

const users           = ref([]);
const loading         = ref(false);
const error           = ref(null);
const searchQuery     = ref('');
const rolFiltro       = ref('Todos');

const createDialog    = ref(false);
const promoteDialog   = ref(false);
const demoteDialog    = ref(false);
const selectedUser    = ref(null);
const submitting      = ref(false);
const showPassword    = ref(false);
const createForm      = ref({ nombre: '', email: '', password: '' });

// Ambientes
const ambientesDialog       = ref(false);
const loadingAmbientes      = ref(false);
const savingAmbientes       = ref(false);
const selectedAmbientes     = ref([]);
const todasAulas            = ref([]);
const todasZonas            = ref([]);
const zonaFiltroAmbientes   = ref(null);

const currentUserId  = ref(null);
const currentUserRol = ref(null);

const columns = [
    { name: 'nombre',    required: true, label: 'Usuario',             align: 'left',   field: 'nombre',   sortable: true },
    { name: 'rol',       align: 'center', label: 'Rol',                field: 'rol',     sortable: true },
    { name: 'ambientes', align: 'left',   label: 'Ambientes asignados', field: 'ambientes_asignados', sortable: false, style: 'min-width:240px' },
    { name: 'fecha',     align: 'center', label: 'F. Registro',         field: 'createdAt', sortable: true },
    { name: 'actions',   label: 'Acciones', field: 'actions',           align: 'center', style: 'min-width:160px' }
];

const filteredUsers = computed(() => {
    let result = users.value;
    if (rolFiltro.value && rolFiltro.value !== 'Todos')
        result = result.filter(u => u.rol === rolFiltro.value);
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        result = result.filter(u => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return result;
});

const superAdminCount = computed(() => filteredUsers.value.filter(u => u.rol === 'SuperAdmin').length);
const adminCount      = computed(() => filteredUsers.value.filter(u => u.rol === 'Admin').length);
const commonCount     = computed(() => filteredUsers.value.filter(u => u.rol === 'Comun').length);

const zonasOptions = computed(() => todasZonas.value);

const filteredAmbientesOptions = computed(() => {
    if (!zonaFiltroAmbientes.value) return todasAulas.value;
    return todasAulas.value.filter(a => {
        const zonaId = a.zona?._id || a.zona;
        return String(zonaId) === String(zonaFiltroAmbientes.value);
    });
});

const getRolColor = (rol) => ({ SuperAdmin: 'deep-purple', Admin: 'primary', Comun: 'grey' }[rol] || 'grey');
const getRolIcon  = (rol) => ({ SuperAdmin: 'shield', Admin: 'admin_panel_settings', Comun: 'person' }[rol] || 'person');

const formatDate = (ds) => {
    if (!ds) return 'N/A';
    return new Date(ds).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
};
const getUserInitials = (nombre) => {
    if (!nombre) return '?';
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const loadCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const decoded = jwtDecode(token);
            currentUserId.value  = decoded.sub;
            currentUserRol.value = decoded.rol;
        } catch (err) { console.error(err); }
    }
};

const loadUsers = async () => {
    loading.value = true;
    error.value = null;
    try {
        const { data } = await api.get('/users');
        users.value = data;
    } catch (err) {
        error.value = 'Error al cargar los usuarios.';
        $q.notify({ type: 'negative', message: 'No se pudieron cargar los usuarios', position: 'top', timeout: 3000 });
    } finally {
        loading.value = false;
    }
};

// ── Asignación de Ambientes ───────────────────────────────────────────────────
const openAmbientesDialog = async (user) => {
    selectedUser.value      = user;
    selectedAmbientes.value = (user.ambientes_asignados || []).map(a => a._id || a);
    zonaFiltroAmbientes.value = null;
    ambientesDialog.value   = true;
    loadingAmbientes.value  = true;
    try {
        const [aulas, zonas] = await Promise.all([
            classroomsService.getAll(),
            zonesService.getAll()
        ]);
        todasAulas.value  = aulas;
        todasZonas.value  = zonas;
    } catch (err) {
        $q.notify({ type: 'negative', message: 'Error cargando ambientes', position: 'top', timeout: 3000 });
    } finally {
        loadingAmbientes.value = false;
    }
};

const toggleAmbiente = (aulaId) => {
    const idx = selectedAmbientes.value.indexOf(aulaId);
    if (idx === -1) selectedAmbientes.value.push(aulaId);
    else selectedAmbientes.value.splice(idx, 1);
};

const selectAllAmbientes = () => {
    selectedAmbientes.value = filteredAmbientesOptions.value.map(a => a._id);
};

const saveAmbientes = async () => {
    if (!selectedUser.value) return;
    savingAmbientes.value = true;
    try {
        await api.patch(`/users/${selectedUser.value._id}/ambientes`, {
            ambientes: selectedAmbientes.value
        });
        $q.notify({
            type: 'positive',
            message: `Ambientes actualizados para ${selectedUser.value.nombre}`,
            position: 'top', timeout: 3000
        });
        ambientesDialog.value = false;
        await loadUsers();
    } catch (err) {
        $q.notify({
            type: 'negative',
            message: err.response?.data?.message || 'Error al guardar ambientes',
            position: 'top', timeout: 4000
        });
    } finally {
        savingAmbientes.value = false;
    }
};

// ── Crear / Promover / Degradar ───────────────────────────────────────────────
const openCreateDialog = () => {
    createForm.value = { nombre: '', email: '', password: '' };
    showPassword.value = false;
    createDialog.value = true;
};

const submitCreate = async () => {
    submitting.value = true;
    try {
        await api.post('/users', { ...createForm.value, rol: 'Admin' });
        $q.notify({ type: 'positive', message: 'Administrador creado exitosamente', position: 'top', timeout: 3000 });
        createDialog.value = false;
        await loadUsers();
    } catch (err) {
        $q.notify({
            type: 'negative',
            message: err.response?.status === 409 ? 'Ya existe un usuario con ese email' : (err.response?.data?.message || 'Error al crear'),
            position: 'top', timeout: 4000
        });
    } finally {
        submitting.value = false;
    }
};

const confirmPromote = (user) => { selectedUser.value = user; promoteDialog.value = true; };
const confirmDemote  = (user) => { selectedUser.value = user; demoteDialog.value  = true; };

const promoteUser = async (user) => {
    if (!user) return;
    submitting.value = true;
    try {
        await api.patch(`/users/${user._id}/role`, { rol: 'Admin' });
        $q.notify({ type: 'positive', message: `${user.nombre} ahora es Administrador`, position: 'top', timeout: 3000 });
        promoteDialog.value = false;
        selectedUser.value  = null;
        await loadUsers();
    } catch (err) {
        $q.notify({ type: 'negative', message: err.response?.data?.message || 'Error al promover', position: 'top', timeout: 4000 });
    } finally {
        submitting.value = false;
    }
};

const demoteUser = async (user) => {
    if (!user) return;
    submitting.value = true;
    try {
        await api.patch(`/users/${user._id}/role`, { rol: 'Comun' });
        $q.notify({ type: 'info', message: `${user.nombre} ahora es Usuario Común`, position: 'top', timeout: 3000 });
        demoteDialog.value = false;
        selectedUser.value = null;
        await loadUsers();
    } catch (err) {
        $q.notify({ type: 'negative', message: err.response?.data?.message || 'Error al degradar', position: 'top', timeout: 4000 });
    } finally {
        submitting.value = false;
    }
};

onMounted(() => {
    loadCurrentUserId();
    loadUsers();
});
</script>

<style scoped>
.bg-grey-2   { background-color: #f5f5f5; }
.bg-warning-1 { background-color: #fff8e6; }
.text-warning { color: #F4A010; }
.rounded-borders { border-radius: 8px; }
</style>