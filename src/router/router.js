import { createRouter, createWebHistory } from 'vue-router';

import Login          from '../views/Auth/Login.vue';
import Register       from '../views/Auth/Register.vue';
import ForgotPassword from '../views/Auth/ForgotPassword.vue';
import ResetPassword  from '../views/Auth/ResetPassword.vue';

// USER
import UserLayout   from '../views/User/UserLayout.vue';
import Zones        from '../views/User/SedesDashboard.vue';
import Classrooms   from '../views/User/AmbientesDashboard.vue';
import Items        from '../views/User/ItemsDashboard.vue';
import ItemD        from '../views/User/ItemDetail.vue';
import Loans        from '../views/User/PrestamosDashboard.vue';
import PanelPrestamo from '../views/User/PanelPrestamo.vue';

// ADMIN
import AdminLayout         from '../views/Admin/AdminLayout.vue';
import AulasGestion        from '../views/Admin/AmbientesGestion.vue';
import ItemsGestion        from '../views/Admin/MaterialesGestion.vue';
import EquiposGestion      from '../views/Admin/EquiposGestion.vue';
import ZonasGestion        from '../views/Admin/SedesGestion.vue';
import PrestamosAdmin      from '../views/Admin/PrestamosAdmin.vue';
import SolicitudesAdmin    from '../views/Admin/SolicitudesAdmin.vue';
import UsuariosGestion     from '../views/Admin/UsuariosGestion.vue';
import CuentadantesGestion from '../views/Admin/CuentadantesGestion.vue';
import ArchivoAdmin        from '../views/Admin/ArchivoAdmin.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // ─── PUBLIC ───────────────────────────────────────────────────────────
        { path: '/',                  name: 'login',         component: Login },
        { path: '/register',          name: 'register',      component: Register },
        { path: '/forgot-password',   name: 'forgotPassword', component: ForgotPassword },
        { path: '/reset-password',    name: 'resetPassword', component: ResetPassword },

        // ─── USER ─────────────────────────────────────────────────────────────
        {
            path: '/user',
            component: UserLayout,
            children: [
                { path: 'dashboard',  name: 'user.dashboard',  component: Zones },
                { path: 'zones',      name: 'user.zones',       component: Zones },
                { path: 'classrooms', name: 'user.classrooms',  component: Classrooms },
                { path: 'items',      name: 'user.items',       component: Items },
                { path: 'item/:id',   name: 'user.itemDetail',  component: ItemD },
                { path: 'loans',      name: 'user.loans',       component: Loans },
                { path: 'cart',       name: 'user.cart',        component: PanelPrestamo },
            ]
        },

        // ─── ADMIN ────────────────────────────────────────────────────────────
        {
            path: '/admin',
            component: AdminLayout,
            meta: { requiresAdmin: true },
            children: [
                // Todos los admins
                { path: 'dashboard',  name: 'admin.dashboard',  component: SolicitudesAdmin },
                { path: 'requests',   name: 'admin.requests',   component: SolicitudesAdmin },
                { path: 'loans',      name: 'admin.loans',      component: PrestamosAdmin },
                { path: 'items',      name: 'admin.items',      component: ItemsGestion },
                { path: 'equipos',    name: 'admin.equipos',    component: EquiposGestion },

                // Solo SuperAdmin
                { path: 'zones',         name: 'admin.zones',         component: ZonasGestion,        meta: { requiresSuperAdmin: true } },
                { path: 'classrooms',    name: 'admin.classrooms',    component: AulasGestion,        meta: { requiresSuperAdmin: true } },
                { path: 'users',         name: 'admin.users',         component: UsuariosGestion,     meta: { requiresSuperAdmin: true } },
                { path: 'cuentadantes',  name: 'admin.cuentadantes',  component: CuentadantesGestion, meta: { requiresSuperAdmin: true } },
                { path: 'archivo',        name: 'admin.archivo',        component: ArchivoAdmin,         meta: { requiresSuperAdmin: true } },
            ]
        }
    ]
});

const ADMIN_ROLES      = ['Admin', 'SuperAdmin'];
const SUPER_ADMIN_ROLE = 'SuperAdmin';

router.beforeEach((to, from, next) => {
    document.title = to.meta.title
        ? `${to.meta.title} - Sistema de Inventario`
        : 'Sistema de Inventario';

    const token = localStorage.getItem('token');
    const rol   = localStorage.getItem('userRol');

    // Ruta solo para SuperAdmin
    if (to.matched.some(r => r.meta?.requiresSuperAdmin)) {
        if (!token) return next('/');
        if (rol !== SUPER_ADMIN_ROLE) return next('/admin/dashboard');
    }

    // Ruta que requiere cualquier rol admin
    if (to.matched.some(r => r.meta?.requiresAdmin)) {
        if (!token) return next('/');
        if (!ADMIN_ROLES.includes(rol)) return next('/user/loans');
    }

    // Si ya está logueado y va al login/register
    if ((to.path === '/' || to.path === '/register') && token) {
        return ADMIN_ROLES.includes(rol)
            ? next('/admin/dashboard')
            : next('/user/loans');
    }

    // Proteger rutas /user/* — requieren token
    if (to.path.startsWith('/user') && !token) {
        return next('/');
    }

    next();
});

export default router;