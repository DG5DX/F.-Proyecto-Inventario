<template>
    <q-layout view="lHh LpR fFf">
        <q-header elevated class="bg-secondary text-white">
            <q-toolbar>
                <q-btn 
                    dense 
                    flat 
                    round 
                    icon="menu" 
                    @click="toggleLeftDrawer" 
                    aria-label="Toggle Menu" 
                />

                <q-toolbar-title>
                    <q-icon name="admin_panel_settings" class="q-mr-sm"/>
                    Panel de Administración
                </q-toolbar-title>

                <q-space />

                <!-- Info de usuario en toolbar -->
                <div class="q-ml-md row items-center no-wrap">
                    <q-avatar size="36px" color="primary" text-color="white">
                        {{ userInitials }}
                    </q-avatar>
                    <div class="q-ml-sm gt-sm">
                        <div class="text-weight-medium text-body2">{{ userName }}</div>
                        <div class="text-caption opacity-70">Administrador</div>
                    </div>
                </div>
            </q-toolbar>
        </q-header>

        <!-- Drawer lateral -->
        <q-drawer 
            show-if-above 
            v-model="leftDrawerOpen" 
            side="left" 
            bordered 
            :width="260" 
            class="bg-dark"
        >
            <!-- Perfil de usuario -->
            <div class="q-pa-lg text-center text-white profile-section">
                <q-avatar size="80px" color="primary" text-color="white" class="q-mb-md">
                    {{ userInitials }}
                </q-avatar>
                <div class="text-h6 text-weight-bold text-white q-mb-xs">
                    {{ userNombre }}
                </div>
                <q-chip 
                    size="md" 
                    color="primary" 
                    text-color="white" 
                    icon="admin_panel_settings"
                    class="q-mt-sm"
                >
                    Administrador
                </q-chip>
                <q-separator dark class="q-mt-lg"/>
            </div>

            <!-- Menú de navegación -->
            <q-list dark class="q-pt-md">
                <q-item-label header class="text-primary text-weight-bold">
                    <q-icon name="dashboard" size="xs" class="q-mr-xs"/>
                    ADMINISTRACIÓN
                </q-item-label>

                <!-- Solicitudes Pendientes -->
                <q-item 
                    clickable 
                    v-ripple 
                    to="/admin/requests"
                    exact
                    active-class="bg-primary text-white"
                    class="menu-item"
                >
                    <q-item-section avatar>
                        <q-icon name="notifications" size="md" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Solicitudes</q-item-label>
                        <q-item-label caption>Pendientes de aprobar</q-item-label>
                    </q-item-section>
                    <q-item-section side v-if="pendingRequestsCount > 0">
                        <q-badge color="orange" :label="pendingRequestsCount" />
                    </q-item-section>
                </q-item>

                <!-- Préstamos Activos -->
                <q-item 
                    clickable 
                    v-ripple 
                    to="/admin/loans"
                    exact
                    active-class="bg-primary text-white"
                    class="menu-item"
                >
                    <q-item-section avatar>
                        <q-icon name="swap_horiz" size="md" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Préstamos</q-item-label>
                        <q-item-label caption>Ver todos</q-item-label>
                    </q-item-section>
                </q-item>

                <q-separator dark class="q-my-md"/>

                <!-- SecciÃ³n de Gestión -->
                <q-item-label header class="text-primary text-weight-bold">
                    <q-icon name="settings" size="xs" class="q-mr-xs"/>
                    GESTIÓN DE INVENTARIO
                </q-item-label>

                <!-- Gestión de Zonas -->
                <q-item 
                    clickable 
                    v-ripple 
                    to="/admin/zones"
                    exact
                    active-class="bg-primary text-white"
                    class="menu-item"
                >
                    <q-item-section avatar>
                        <q-icon name="category" size="md" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Zonas</q-item-label>
                        <q-item-label caption>Categorías</q-item-label>
                    </q-item-section>
                </q-item>

                <!-- Gestión de Aulas -->
                <q-item 
                    clickable 
                    v-ripple 
                    to="/admin/classrooms"
                    exact
                    active-class="bg-primary text-white"
                    class="menu-item"
                >
                    <q-item-section avatar>
                        <q-icon name="meeting_room" size="md" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Aulas</q-item-label>
                        <q-item-label caption>Ubicaciones</q-item-label>
                    </q-item-section>
                </q-item>

                <!-- Gestión de Ítems -->
                <q-item 
                    clickable 
                    v-ripple 
                    to="/admin/items"
                    exact
                    active-class="bg-primary text-white"
                    class="menu-item"
                >
                    <q-item-section avatar>
                        <q-icon name="inventory_2" size="md" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Ítems</q-item-label>
                        <q-item-label caption>Inventario completo</q-item-label>
                    </q-item-section>
                </q-item>

                <q-separator dark class="q-my-md"/>
                <!-- Sección de Sistema -->
                <q-item-label header class="text-primary text-weight-bold">
                    <q-icon name="settings" size="xs" class="q-mr-xs"/>
                    SISTEMA
                </q-item-label>

                <!-- Gestión de Usuarios -->
                <q-item 
                    clickable 
                    v-ripple 
                    to="/admin/users"
                    exact
                    active-class="bg-primary text-white"
                    class="menu-item"
                >
                    <q-item-section avatar>
                        <q-icon name="people" size="md" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Usuarios</q-item-label>
                        <q-item-label caption>Gestionar administradores</q-item-label>
                    </q-item-section>
                </q-item>

                <q-separator dark class="q-my-md"/>


                <!-- Sección de Opciones -->
                <q-item-label header class="text-grey-5 text-weight-bold">
                    <q-icon name="more_horiz" size="xs" class="q-mr-xs"/>
                    OPCIONES
                </q-item-label>

                <q-item 
                    clickable 
                    v-ripple 
                    @click="showHelpDialog = true"
                    class="menu-item"
                >
                    <q-item-section avatar>
                        <q-icon name="help_outline" color="info" size="md" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>Ayuda</q-item-label>
                    </q-item-section>
                </q-item>

                <q-item 
                    clickable 
                    v-ripple 
                    @click="confirmLogout"
                    class="menu-item"
                >
                    <q-item-section avatar>
                        <q-icon name="logout" color="negative" size="md" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>Cerrar Sesión</q-item-label>
                    </q-item-section>
                </q-item>
            </q-list>

        </q-drawer>
        
        <!-- Contenedor de páginas -->
        <q-page-container>
            <router-view/>
        </q-page-container>

        <!-- Dialog de ayuda -->
        <q-dialog v-model="showHelpDialog">
            <q-card style="width: 90vw; max-width: 500px;">
                <q-card-section class="bg-primary text-white">
                    <div class="text-h6">
                        <q-icon name="help_outline" class="q-mr-sm"/>
                        Ayuda para Administradores
                    </div>
                </q-card-section>
                <q-card-section>
                    <div class="text-h6 q-mb-md">Funciones principales</div>
                    <q-list>
                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="notifications" color="orange" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-medium">Solicitudes</q-item-label>
                                <q-item-label caption>
                                    Revisa y aprueba/rechaza solicitudes de préstamo.
                                </q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="swap_horiz" color="primary" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-medium">Préstamos</q-item-label>
                                <q-item-label caption>
                                    Gestiona devoluciones y aplazamientos de préstamos activos.
                                </q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="inventory_2" color="positive" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-medium">Gestión</q-item-label>
                                <q-item-label caption>
                                    Administra zonas, aulas e ítems del inventario (CRUD completo).
                                </q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="people" color="positive" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-medium">Usuarios</q-item-label>
                                <q-item-label caption>
                                    Verifica los roles de los usuarios, asi como crear administradores.   
                                </q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat label="Entendido" color="primary" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- Dialog de cerrar sesión -->
        <q-dialog v-model="showLogoutDialog" persistent>
            <q-card style="width: 90vw; max-width: 400px;">
                <q-card-section class="row items-center">
                    <q-avatar icon="logout" color="negative" text-color="white" />
                    <span class="q-ml-sm text-h6">Cerrar Sesión</span>
                </q-card-section>

                <q-card-section>
                    ¿Estás segur@ que deseas cerrar sesión?
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="grey" v-close-popup />
                    <q-btn flat label="Cerrar Sesión" color="negative" @click="logout" />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { loansService } from '../../services/items.js';

const router = useRouter();
const $q = useQuasar();

// Estados reactivos
const leftDrawerOpen = ref(false);
const showHelpDialog = ref(false);
const showLogoutDialog = ref(false);
const pendingRequestsCount = ref(0);

// Datos del usuario desde localStorage
const userNombre = ref('Administrador');

// Función para cargar datos del usuario
const loadUserData = () => {
    const nombre = localStorage.getItem('userNombre');
    if (nombre) userNombre.value = nombre;
};

// Computed para iniciales del usuario
const userInitials = computed(() => {
    const nombre = userNombre.value || 'A';
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

// Computed para nombre del usuario
const userName = computed(() => {
    const nombre = userNombre.value || 'Admin';
    return nombre.split(' ')[0];
});

// Función para toggle del drawer
function toggleLeftDrawer() {
    leftDrawerOpen.value = !leftDrawerOpen.value;
}

// Función para confirmar cierre de sesión
const confirmLogout = () => {
    showLogoutDialog.value = true;
};

// Función para cerrar sesión
function logout() {
    showLogoutDialog.value = false;
    
    localStorage.removeItem('token');
    localStorage.removeItem('userNombre');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRol');
    
    $q.notify({
        type: 'positive',
        message: 'Sesión cerrada exitosamente',
        position: 'top',
        icon: 'check_circle',
        timeout: 2000
    });
    
    router.push('/');
}

// Función para cargar contador de solicitudes pendientes
const loadPendingRequestsCount = async () => {
    try {
        const loans = await loansService.getAll({ estado: 'Pendiente' });
        pendingRequestsCount.value = loans.length;
    } catch (err) {
        console.error('Error cargando solicitudes pendientes:', err);
    }
};

// Cargar datos al montar
onMounted(async () => {
    loadUserData();
    await loadPendingRequestsCount();
    setInterval(loadPendingRequestsCount, 30000);
});

// Watch para actualizar cuando cambien los datos en localStorage
watch(() => localStorage.getItem('userNombre'), () => {
    loadUserData();
});
</script>

<style scoped>
.q-page-container {
    background-color: #f5f5f5;
}

.bg-dark {
    background-color: #263238 !important;
}

.bg-secondary {
    background-color: #004d40 !important;
}

.profile-section {
    background: linear-gradient(135deg, #2d3e47 0%, #1a252b 100%);
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.opacity-70 {
    opacity: 0.7;
}

.q-drawer {
    transition: all 0.3s ease;
}

.menu-item {
    transition: all 0.2s ease;
    margin: 4px 8px;
    border-radius: 8px;
}

.menu-item:hover {
    background-color: rgba(255, 255, 255, 0.08) !important;
}
</style>