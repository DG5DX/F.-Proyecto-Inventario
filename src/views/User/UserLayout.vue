<template>
    <q-layout view="lHh LpR fFF">
        <q-header elevated class="bg-secondary text-white">
            <q-toolbar>
                <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" aria-label="Toggle Menu" />

                <q-toolbar-title>
                    <q-icon name="inventory" class="q-mr-sm" />
                    Sistema de Inventario
                </q-toolbar-title>

                <q-space />

                <!-- Info de usuario en toolbar -->
                <div class="q-ml-md row items-center no-wrap">
                    <q-avatar size="36px" color="primary" text-color="white">
                        {{ userInitials }}
                    </q-avatar>
                    <div class="q-ml-sm gt-sm">
                        <div class="text-weight-medium text-body2">{{ userName }}</div>
                        <div class="text-caption opacity-70">Usuario</div>
                    </div>
                </div>
            </q-toolbar>
        </q-header>

        <!-- Drawer lateral -->
        <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="260" class="bg-dark">
            <!-- Perfil de usuario -->
            <div class="q-pa-lg text-center text-white profile-section">
                <q-avatar size="80px" color="primary" text-color="white" class="q-mb-md">
                    {{ userInitials }}
                </q-avatar>
                <div class="text-h6 text-weight-bold text-white q-mb-xs">
                    {{ userNombre }}
                </div>
                <q-chip size="md" color="primary" text-color="white" icon="person" class="q-mt-sm">
                    Usuario
                </q-chip>
                <q-separator dark class="q-mt-lg" />
            </div>

            <!-- Menú de navegación -->
            <q-list dark class="q-pt-md">
                <q-item-label header class="text-primary text-weight-bold">
                    <q-icon name="menu" size="xs" class="q-mr-xs" />
                    MENÚ PRINCIPAL
                </q-item-label>

                <q-item clickable v-ripple to="/user/zones" exact active-class="bg-primary text-white"
                    class="menu-item">
                    <q-item-section avatar>
                        <q-icon name="view_module" size="md" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Catálogo</q-item-label>
                        <q-item-label caption>Explorar inventario</q-item-label>
                    </q-item-section>
                </q-item>

                <q-item clickable v-ripple to="/user/loans" exact active-class="bg-primary text-white"
                    class="menu-item">
                    <q-item-section avatar>
                        <q-icon name="assignment" size="md" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Mis Préstamos</q-item-label>
                        <q-item-label caption>Ver solicitudes</q-item-label>
                    </q-item-section>
                    <q-item-section side v-if="pendingLoansCount > 0">
                        <q-badge color="orange" :label="pendingLoansCount" />
                    </q-item-section>
                </q-item>

                <q-separator dark class="q-my-md" />

                <!-- Sección de acciones -->
                <q-item-label header class="text-grey-5 text-weight-bold">
                    <q-icon name="settings" size="xs" class="q-mr-xs" />
                    OPCIONES
                </q-item-label>

                <q-item clickable v-ripple @click="showHelpDialog = true" class="menu-item">
                    <q-item-section avatar>
                        <q-icon name="help_outline" color="info" size="md" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>Ayuda</q-item-label>
                    </q-item-section>
                </q-item>

                <q-item clickable v-ripple @click="confirmLogout" class="menu-item">
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
            <router-view />
        </q-page-container>

        <!-- Dialog de ayuda -->
        <q-dialog v-model="showHelpDialog">
            <q-card style="width: 90vw; max-width: 500px;">
                <q-card-section class="bg-primary text-white">
                    <div class="text-h6">
                        <q-icon name="help_outline" class="q-mr-sm" />
                        Ayuda del Sistema
                    </div>
                </q-card-section>
                <q-card-section>
                    <div class="text-h6 q-mb-md">¿Cómo usar el sistema?</div>
                    <q-list>
                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="view_module" color="primary" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-medium">Explorar Catálogo</q-item-label>
                                <q-item-label caption>
                                    Navega por zonas → aulas → ítems disponibles
                                </q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="add_shopping_cart" color="positive" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-medium">Solicitar Préstamos</q-item-label>
                                <q-item-label caption>
                                    Haz clic en cualquier ítem para solicitar un préstamo
                                </q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="assignment" color="info" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-medium">Ver Préstamos</q-item-label>
                                <q-item-label caption>
                                    Consulta el estado de tus solicitudes y préstamos activos
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
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { loansService } from '../../services/items.js';

const router = useRouter();
const $q = useQuasar();

// Estados reactivos
const leftDrawerOpen = ref(false);
const showHelpDialog = ref(false);
const showLogoutDialog = ref(false);
const pendingLoansCount = ref(0);

// Datos del usuario desde localStorage
const userNombre = ref('Usuario');

// Función para cargar datos del usuario
const loadUserData = () => {
    const nombre = localStorage.getItem('userNombre');
    if (nombre) userNombre.value = nombre;
};

// Computed para iniciales del usuario
const userInitials = computed(() => {
    const nombre = userNombre.value || 'U';
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

// Computed para nombre del usuario
const userName = computed(() => {
    const nombre = userNombre.value || 'Usuario';
    return nombre.split(' ')[0];
});

// Función para toggle del drawer
const toggleLeftDrawer = () => {
    leftDrawerOpen.value = !leftDrawerOpen.value;
};

// Función para confirmar cierre de sesión
const confirmLogout = () => {
    showLogoutDialog.value = true;
};

// Función para cerrar sesión
const logout = () => {
    showLogoutDialog.value = false;

    localStorage.removeItem('token');
    localStorage.removeItem('userNombre');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRol');

    $q.notify({
        type: 'negative',
        message: 'Sesión cerrada exitosamente',
        position: 'top',
        icon: 'logout',
        timeout: 2000
    });

    router.push('/');
};

// Función para cargar contador de préstamos pendientes
const loadPendingLoansCount = async () => {
    try {
        const loans = await loansService.getAll();
        pendingLoansCount.value = loans.filter(loan => loan.estado === 'Pendiente').length;
    } catch (err) {
        console.error('Error cargando préstamos pendientes:', err);
    }
};

// Cargar datos al montar
onMounted(async () => {
    loadUserData();
    await loadPendingLoansCount();
    setInterval(loadPendingLoansCount, 30000);
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
    background-color: #00695c !important;
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