<template>
    <q-layout view="lHh LpR fFF">
        <q-header elevated class="bg-secondary text-white">
            <q-toolbar style="background-color:#1a4f00">
                <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" aria-label="Toggle Menu" />

                <q-toolbar-title>
                    <q-icon name="inventory" class="q-mr-sm" />
                    Sistema de Inventario
                </q-toolbar-title>

                <q-space />

                <!-- Botón del carrito en header -->
                <q-btn
                    flat round dense
                    icon="inventory"
                    to="/user/cart"
                    class="q-mr-sm"
                    aria-label="Panel de préstamo"
                >
                    <q-badge
                        v-if="cartTotalItems > 0"
                        color="orange"
                        :label="cartTotalItems"
                        floating
                    />
                    <q-tooltip>Panel de Préstamo</q-tooltip>
                </q-btn>

                <div class="q-ml-sm row items-center no-wrap">
                    <q-avatar size="36px" color="dark" text-color="white">
                        {{ userInitials }}
                    </q-avatar>
                    <div class="q-ml-sm gt-sm">
                        <div class="text-weight-medium text-body2">{{ userName }}</div>
                        <div class="text-caption opacity-70">Usuario</div>
                    </div>
                </div>
            </q-toolbar>
        </q-header>

        <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="260" class="bg-dark">
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

                <!-- Panel de Préstamo (carrito) -->
                <q-item
                    clickable v-ripple to="/user/cart"
                    exact active-class="bg-primary text-white"
                    class="menu-item"
                >
                    <q-item-section avatar>
                        <q-icon name="inventory" size="md" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Panel de Préstamo</q-item-label>
                        <q-item-label caption>Equipos seleccionados</q-item-label>
                    </q-item-section>
                    <q-item-section side v-if="cartTotalItems > 0">
                        <q-badge color="orange" :label="cartTotalItems" />
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

        <q-page-container>
            <router-view />
        </q-page-container>

        <!-- Dialog Ayuda -->
        <q-dialog v-model="showHelpDialog">
            <q-card style="width: 90vw; max-width: 520px;">
                <q-card-section class="bg-primary text-white">
                    <div class="text-h6 row items-center">
                        <q-icon name="help_outline" class="q-mr-sm" />
                        Ayuda del Sistema
                    </div>
                    <div class="text-caption opacity-80 q-mt-xs">Sistema de Inventario SENA</div>
                </q-card-section>
                <q-card-section style="max-height: 65vh; overflow-y: auto;">

                    <div class="text-subtitle2 text-grey-6 q-mb-sm q-mt-xs">¿CÓMO SOLICITAR UN PRÉSTAMO?</div>
                    <q-list dense>
                        <q-item>
                            <q-item-section avatar><q-icon name="view_module" color="primary" /></q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-medium">1. Explora el catálogo</q-item-label>
                                <q-item-label caption>Navega por Sedes → Ambientes → Materiales disponibles para encontrar lo que necesitas.</q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section avatar><q-icon name="add_box" color="positive" /></q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-medium">2. Agrega al Panel de Préstamo</q-item-label>
                                <q-item-label caption>Desde la ficha de cada material, selecciona la cantidad y agrégalo al panel. Puedes acumular varios materiales antes de enviar.</q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section avatar><q-icon name="inventory" color="primary" /></q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-medium">3. Envía la solicitud desde el Panel</q-item-label>
                                <q-item-label caption>Abre el Panel de Préstamo (ícono de caja en el menú), revisa los materiales, indica la fecha de devolución y envía. Un administrador la revisará.</q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section avatar><q-icon name="assignment" color="orange" /></q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-medium">4. Sigue el estado en Mis Préstamos</q-item-label>
                                <q-item-label caption>Consulta si tu solicitud fue aprobada, rechazada o está pendiente. Cuando vayas a devolver, notifícalo desde ahí.</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>

                    <q-separator class="q-my-sm"/>
                    <div class="text-subtitle2 text-grey-6 q-mb-sm">TIPOS DE MATERIAL</div>
                    <q-list dense>
                        <q-item>
                            <q-item-section avatar><q-icon name="category" color="orange" /></q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-medium">Consumibles</q-item-label>
                                <q-item-label caption>Materiales que se usan y no se devuelven (marcadores, papel, etc.). Al notificar, indica cuánto usaste.</q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section avatar><q-icon name="precision_manufacturing" color="primary" /></q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-medium">Devolutivos (Equipos)</q-item-label>
                                <q-item-label caption>Equipos y herramientas que deben devolverse en buen estado. Notifica la devolución cuando los entregues al almacén.</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>

                    <q-separator class="q-my-sm"/>
                    <div class="text-subtitle2 text-grey-6 q-mb-sm">TIPS</div>
                    <q-list dense>
                        <q-item>
                            <q-item-section avatar><q-icon name="schedule" color="orange" /></q-item-section>
                            <q-item-section>
                                <q-item-label caption>Si tu préstamo está próximo a vencer recibirás un recordatorio por correo. Notifica la devolución a tiempo para evitar inconvenientes.</q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section avatar><q-icon name="info" color="primary" /></q-item-section>
                            <q-item-section>
                                <q-item-label caption>Puedes hacer devoluciones parciales: si pediste 10 unidades, puedes devolver 6 ahora y el resto después.</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>

                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat label="Entendido" color="primary" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- Dialog Logout -->
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
import { loansService } from '../../services/items.js';
import { useLoanCart } from '../../services/loanCart.js';

const router = useRouter();
const $q = useQuasar();
const cart = useLoanCart();

const leftDrawerOpen  = ref(false);
const showHelpDialog  = ref(false);
const showLogoutDialog = ref(false);
const pendingLoansCount = ref(0);
const userNombre = ref('Usuario');

// Carrito
const cartTotalItems = computed(() => cart.totalItems.value);

const loadUserData = () => {
    const nombre = localStorage.getItem('userNombre');
    if (nombre) userNombre.value = nombre;
};

const userInitials = computed(() => {
    const nombre = userNombre.value || 'U';
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

const userName = computed(() => {
    const nombre = userNombre.value || 'Usuario';
    return nombre.split(' ')[0];
});

const toggleLeftDrawer = () => { leftDrawerOpen.value = !leftDrawerOpen.value; };
const confirmLogout    = () => { showLogoutDialog.value = true; };

const logout = () => {
    showLogoutDialog.value = false;
    // Limpiar carrito al cerrar sesión
    cart.clearCart();
    localStorage.removeItem('token');
    localStorage.removeItem('userNombre');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRol');
    $q.notify({ type: 'negative', message: 'Sesión cerrada exitosamente', position: 'top', icon: 'logout', timeout: 2000 });
    router.push('/');
};

const loadPendingLoansCount = async () => {
    try {
        const loans = await loansService.getAll();
        pendingLoansCount.value = loans.filter(loan => loan.estado === 'Pendiente').length;
    } catch (err) {
        console.error('Error cargando préstamos pendientes:', err);
    }
};

onMounted(async () => {
    loadUserData();
    await loadPendingLoansCount();
    setInterval(loadPendingLoansCount, 30000);
});

watch(() => localStorage.getItem('userNombre'), () => { loadUserData(); });
</script>

<style scoped>
.q-page-container { background-color: #f5f5f5; }
.bg-dark           { background-color: #263238 !important; }
.bg-secondary      { background-color: #00695c !important; }

.profile-section {
    background: linear-gradient(135deg, #2d3e47 0%, #1a252b 100%);
    border-bottom: 2px solid rgba(255,255,255,0.1);
}

.opacity-70 { opacity: 0.7; }

.q-drawer { transition: all 0.3s ease; }

.menu-item {
    transition: all 0.2s ease;
    margin: 4px 8px;
    border-radius: 8px;
}
.menu-item:hover { background-color: rgba(255,255,255,0.08) !important; }
</style>