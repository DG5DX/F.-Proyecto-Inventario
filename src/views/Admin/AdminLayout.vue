<template>
    <q-layout view="lHh LpR fFf">
        <q-header elevated class="bg-secondary text-white">
            <q-toolbar style="background-color:#1a4f00">
                <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" aria-label="Toggle Menu" />
                <q-toolbar-title>
                    <q-icon name="admin_panel_settings" class="q-mr-sm"/>
                    Panel de Administración
                </q-toolbar-title>
                <q-space />
                <div class="q-ml-md row items-center no-wrap">
                    <q-avatar size="36px" color="dark" text-color="white">{{ userInitials }}</q-avatar>
                    <div class="q-ml-sm gt-sm">
                        <div class="text-weight-medium text-body2">{{ userName }}</div>
                        <div class="text-caption opacity-70">{{ isSuperAdmin ? 'Super Admin' : 'Administrador' }}</div>
                    </div>
                </div>
            </q-toolbar>
        </q-header>

        <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered :width="260" class="bg-dark">
            <div class="q-pa-lg text-center text-white profile-section">
                <q-avatar size="80px" color="primary" text-color="white" class="q-mb-md">{{ userInitials }}</q-avatar>
                <div class="text-h6 text-weight-bold text-white q-mb-xs">{{ userNombre }}</div>
                <q-chip size="md" :color="isSuperAdmin ? 'deep-purple' : 'primary'" text-color="white"
                    :icon="isSuperAdmin ? 'shield' : 'admin_panel_settings'" class="q-mt-sm">
                    {{ isSuperAdmin ? 'Super Admin' : 'Administrador' }}
                </q-chip>
                <q-separator dark class="q-mt-lg"/>
            </div>

            <q-list dark class="q-pt-md">
                <q-item-label header class="text-primary text-weight-bold">
                    <q-icon name="dashboard" size="xs" class="q-mr-xs"/>ADMINISTRACIÓN
                </q-item-label>

                <q-item clickable v-ripple to="/admin/requests" exact active-class="bg-primary text-white" class="menu-item">
                    <q-item-section avatar><q-icon name="notifications" size="md" /></q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Solicitudes</q-item-label>
                        <q-item-label caption>Pendientes de aprobar</q-item-label>
                    </q-item-section>
                    <q-item-section side v-if="pendingRequestsCount > 0">
                        <q-badge color="orange" :label="pendingRequestsCount" />
                    </q-item-section>
                </q-item>

                <q-item clickable v-ripple to="/admin/loans" exact active-class="bg-primary text-white" class="menu-item">
                    <q-item-section avatar><q-icon name="swap_horiz" size="md" /></q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Préstamos</q-item-label>
                        <q-item-label caption>Ver todos</q-item-label>
                    </q-item-section>
                </q-item>

                <q-separator dark class="q-my-md"/>
                <q-item-label header class="text-primary text-weight-bold">
                    <q-icon name="settings" size="xs" class="q-mr-xs"/>GESTIÓN DE INVENTARIO
                </q-item-label>

                <!-- Sedes: solo SuperAdmin -->
                <q-item v-if="isSuperAdmin"
                    clickable v-ripple to="/admin/zones" exact active-class="bg-primary text-white" class="menu-item">
                    <q-item-section avatar><q-icon name="category" size="md" /></q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Sedes</q-item-label>
                        <q-item-label caption>Gestionar sedes</q-item-label>
                    </q-item-section>
                </q-item>

                <!-- Ambientes: solo SuperAdmin -->
                <q-item v-if="isSuperAdmin"
                    clickable v-ripple to="/admin/classrooms" exact active-class="bg-primary text-white" class="menu-item">
                    <q-item-section avatar><q-icon name="meeting_room" size="md" /></q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Ambientes</q-item-label>
                        <q-item-label caption>Gestionar ambientes</q-item-label>
                    </q-item-section>
                </q-item>

                <!-- Materiales: todos los admins (scope aplicado automáticamente) -->
                <q-item clickable v-ripple to="/admin/items" exact active-class="bg-primary text-white" class="menu-item">
                    <q-item-section avatar><q-icon name="inventory_2" size="md" /></q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Materiales</q-item-label>
                        <q-item-label caption>
                            {{ isSuperAdmin ? 'Consumibles y uso controlado' : 'Mis ambientes' }}
                        </q-item-label>
                    </q-item-section>
                </q-item>

                <!-- Equipos: todos los admins (scope aplicado automáticamente) -->
                <q-item clickable v-ripple to="/admin/equipos" exact active-class="bg-primary text-white" class="menu-item">
                    <q-item-section avatar><q-icon name="precision_manufacturing" size="md" /></q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Equipos y Maquinaria</q-item-label>
                        <q-item-label caption>Devolutivos con placa SENA</q-item-label>
                    </q-item-section>
                </q-item>

                <q-separator dark class="q-my-md"/>
                <q-item-label header class="text-primary text-weight-bold">
                    <q-icon name="settings" size="xs" class="q-mr-xs"/>SISTEMA
                </q-item-label>

                <!-- Usuarios: solo SuperAdmin -->
                <q-item v-if="isSuperAdmin"
                    clickable v-ripple to="/admin/users" exact active-class="bg-primary text-white" class="menu-item">
                    <q-item-section avatar><q-icon name="people" size="md" /></q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Usuarios</q-item-label>
                        <q-item-label caption>Gestionar administradores</q-item-label>
                    </q-item-section>
                </q-item>

                <!-- Cuentadantes: solo SuperAdmin -->
                <q-item v-if="isSuperAdmin"
                    clickable v-ripple to="/admin/cuentadantes" exact active-class="bg-primary text-white" class="menu-item">
                    <q-item-section avatar><q-icon name="badge" size="md" /></q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Cuentadantes</q-item-label>
                        <q-item-label caption>Responsables de inventario</q-item-label>
                    </q-item-section>
                </q-item>

                <!-- Archivo (inhabilitados): solo SuperAdmin -->
                <q-item v-if="isSuperAdmin"
                    clickable v-ripple to="/admin/archivo" exact active-class="bg-deep-orange text-white" class="menu-item">
                    <q-item-section avatar><q-icon name="inventory" size="md" color="deep-orange-4" /></q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Archivo</q-item-label>
                        <q-item-label caption>Elementos inhabilitados</q-item-label>
                    </q-item-section>
                    <q-item-section side v-if="archivoCount > 0">
                        <q-badge color="deep-orange" :label="archivoCount" />
                    </q-item-section>
                </q-item>

                <q-separator dark class="q-my-md"/>
                <q-item-label header class="text-primary text-weight-bold">
                    <q-icon name="shopping_cart" size="xs" class="q-mr-xs"/>MIS PRÉSTAMOS
                </q-item-label>

                <q-item clickable v-ripple to="/user/zones" active-class="bg-teal text-white" class="menu-item">
                    <q-item-section avatar><q-icon name="add_shopping_cart" size="md"/></q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Realizar Préstamo</q-item-label>
                        <q-item-label caption>Solicitar ítems del catálogo</q-item-label>
                    </q-item-section>
                </q-item>

                <q-item clickable v-ripple to="/user/loans" active-class="bg-teal text-white" class="menu-item">
                    <q-item-section avatar><q-icon name="assignment" size="md"/></q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Mis Préstamos</q-item-label>
                        <q-item-label caption>Ver mis solicitudes</q-item-label>
                    </q-item-section>
                </q-item>

                <q-separator dark class="q-my-md"/>
                <q-item-label header class="text-grey-5 text-weight-bold">
                    <q-icon name="more_horiz" size="xs" class="q-mr-xs"/>OPCIONES
                </q-item-label>

                <q-item clickable v-ripple @click="showHelpDialog = true" class="menu-item">
                    <q-item-section avatar><q-icon name="help_outline" color="info" size="md" /></q-item-section>
                    <q-item-section><q-item-label>Ayuda</q-item-label></q-item-section>
                </q-item>

                <q-item clickable v-ripple @click="confirmLogout" class="menu-item">
                    <q-item-section avatar><q-icon name="logout" color="negative" size="md" /></q-item-section>
                    <q-item-section><q-item-label>Cerrar Sesión</q-item-label></q-item-section>
                </q-item>
            </q-list>
        </q-drawer>

        <q-page-container><router-view/></q-page-container>

        <!-- Help Dialog -->
        <q-dialog v-model="showHelpDialog">
            <q-card style="width: 90vw; max-width: 560px;">
                <q-card-section class="bg-primary text-white">
                    <div class="text-h6 row items-center">
                        <q-icon name="help_outline" class="q-mr-sm"/>
                        Ayuda para Administradores
                    </div>
                    <div class="text-caption opacity-80 q-mt-xs">Sistema de Inventario SENA</div>
                </q-card-section>
                <q-card-section style="max-height: 65vh; overflow-y: auto;">

                    <template v-if="!isSuperAdmin">
                        <div class="text-subtitle2 text-grey-6 q-mb-sm q-mt-xs">TU ROL DE ADMINISTRADOR</div>
                        <q-banner class="bg-teal-1 text-teal-9 q-mb-md" rounded dense>
                            <template v-slot:avatar><q-icon name="info" color="teal"/></template>
                            <div class="text-caption">
                                Como <strong>Administrador</strong>, puedes gestionar ítems y préstamos
                                <strong>únicamente de tus ambientes asignados</strong>.
                                El SuperAdmin puede ver y modificar tu asignación en Gestión de Usuarios.
                            </div>
                        </q-banner>
                    </template>

                    <div class="text-subtitle2 text-grey-6 q-mb-sm q-mt-xs">GESTIÓN DE SOLICITUDES Y PRÉSTAMOS</div>
                    <q-list dense>
                        <q-item>
                            <q-item-section avatar><q-icon name="notifications_active" color="orange" /></q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-medium">Solicitudes pendientes</q-item-label>
                                <q-item-label caption>
                                    {{ isSuperAdmin ? 'Aprueba, aplaza o rechaza solicitudes de préstamo. Puedes ajustar cantidades antes de aprobar.' : 'Aprueba o rechaza solicitudes que contengan ítems de tus ambientes asignados.' }}
                                </q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section avatar><q-icon name="swap_horiz" color="primary" /></q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-medium">Préstamos activos</q-item-label>
                                <q-item-label caption>Confirma devoluciones, registra si un ítem no fue devuelto, y aplaza préstamos vigentes.</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>

                    <q-separator class="q-my-sm"/>
                    <div class="text-subtitle2 text-grey-6 q-mb-sm">GESTIÓN DE INVENTARIO</div>
                    <q-list dense>
                        <q-item>
                            <q-item-section avatar><q-icon name="inventory_2" color="primary" /></q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-medium">Materiales y Equipos</q-item-label>
                                <q-item-label caption>
                                    {{ isSuperAdmin
                                        ? 'Gestión completa de todos los ítems del sistema.'
                                        : 'Puedes crear, editar y eliminar ítems solo en tus ambientes asignados.' }}
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

        <!-- Logout Dialog -->
        <q-dialog v-model="showLogoutDialog" persistent>
            <q-card style="width: 90vw; max-width: 400px;">
                <q-card-section class="row items-center">
                    <q-avatar icon="logout" color="negative" text-color="white" />
                    <span class="q-ml-sm text-h6">Cerrar Sesión</span>
                </q-card-section>
                <q-card-section>¿Estás segur@ que deseas cerrar sesión?</q-card-section>
                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="black" v-close-popup />
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
import { loansService, zonesService, classroomsService, itemsService, cuentadantesService } from '../../services/items.js';
import { useLoanCart } from '../../services/loanCart.js';

const router = useRouter();
const $q     = useQuasar();
const cart   = useLoanCart();

const leftDrawerOpen       = ref(false);
const showHelpDialog       = ref(false);
const showLogoutDialog     = ref(false);
const pendingRequestsCount = ref(0);
const archivoCount         = ref(0);
const userNombre           = ref('Administrador');

const isSuperAdmin = computed(() => localStorage.getItem('userRol') === 'SuperAdmin');

const loadUserData = () => {
    const nombre = localStorage.getItem('userNombre');
    if (nombre) userNombre.value = nombre;
};

const userInitials = computed(() => {
    const n = userNombre.value || 'A';
    return n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2);
});
const userName = computed(() => (userNombre.value || 'Admin').split(' ')[0]);

const toggleLeftDrawer = () => { leftDrawerOpen.value = !leftDrawerOpen.value; };
const confirmLogout    = () => { showLogoutDialog.value = true; };

const logout = () => {
    showLogoutDialog.value = false;
    cart.clearCartMemory();
    ['token','userNombre','userEmail','userRol','userId'].forEach(k => localStorage.removeItem(k));
    $q.notify({ type: 'positive', message: 'Sesión cerrada exitosamente', position: 'top', icon: 'check_circle', timeout: 2000 });
    router.push('/');
};

const loadPendingRequestsCount = async () => {
    try {
        const loans = await loansService.getAll({ estado: 'Pendiente' });
        pendingRequestsCount.value = loans.length;
    } catch (err) {
        console.error('Error cargando solicitudes pendientes:', err);
    }
};

const loadArchivoCount = async () => {
    if (!isSuperAdmin.value) return;
    try {
        const [zonas, ambientes, items, cuentadantes] = await Promise.all([
            zonesService.getInactivos(),
            classroomsService.getInactivos(),
            itemsService.getInactivos(),
            cuentadantesService.getInactivos(),
        ]);
        archivoCount.value = zonas.length + ambientes.length + items.length + cuentadantes.length;
    } catch { /* silencioso */ }
};

onMounted(async () => {
    loadUserData();
    await loadPendingRequestsCount();
    await loadArchivoCount();
    setInterval(loadPendingRequestsCount, 30000);
    setInterval(loadArchivoCount, 60000);
});

watch(() => localStorage.getItem('userNombre'), loadUserData);
</script>

<style scoped>
.q-page-container { background-color: #f5f5f5; }
.bg-dark           { background-color: #263238 !important; }
.bg-secondary      { background-color: #004d40 !important; }
.profile-section {
    background: linear-gradient(135deg, #2d3e47 0%, #1a252b 100%);
    border-bottom: 2px solid rgba(255,255,255,0.1);
}
.opacity-70 { opacity: 0.7; }
.q-drawer { transition: all 0.3s ease; }
.menu-item { transition: all 0.2s ease; margin: 4px 8px; border-radius: 8px; }
.menu-item:hover { background-color: rgba(255,255,255,0.08) !important; }
</style>