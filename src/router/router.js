import { createRouter, createWebHistory } from 'vue-router';

import Login from '../views/Auth/Login.vue';
import Register from '../views/Auth/Register.vue';
import ForgotPassword from '../views/Auth/ForgotPassword.vue';
import ResetPassword from '../views/Auth/ResetPassword.vue';

// USER
import UserLayout from '../views/User/UserLayout.vue';
import Zones from '../views/User/ZonasDashboard.vue';
import Classrooms from '../views/User/AulasDashboard.vue';
import Items from '../views/User/ItemsDashboard.vue';
import ItemD from '../views/User/ItemDetail.vue';
import Loans from '../views/User/PrestamosDashboard.vue';

// ADMIN
import AdminLayout from '../views/Admin/AdminLayout.vue';
import AulasGestion from '../views/Admin/AulasGestion.vue';
import ItemsGestion from '../views/Admin/ItemsGestion.vue';
import ZonasGestion from '../views/Admin/ZonasGestion.vue';
import PrestamosAdmin from '../views/Admin/PrestamosAdmin.vue';
import SolicitudesAdmin from '../views/Admin/SolicitudesAdmin.vue';
import UsuariosGestion from '../views/Admin/UsuariosGestion.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [

        // ------------------- PUBLIC --------------------
        {
            path: '/',
            name: 'login',
            component: Login
        },
        {
            path: '/register',
            name: 'register',
            component: Register
        },
        {
            path: '/forgot-password',
            name: 'forgotPassword',
            component: ForgotPassword,
            meta: {
                title: 'Recuperar Contraseña'
            }
        },
        {
            path: '/reset-password',
            name: 'resetPassword',
            component: ResetPassword,
            meta: {
                title: 'Restablecer Contraseña'
            }
        },

        // ------------------- USER --------------------
        {
            path: '/user',
            component: UserLayout,
            children: [
                { path: 'dashboard', name: 'user.dashboard', component: Zones },
                { path: 'zones', name: 'user.zones', component: Zones },
                { path: 'classrooms', name: 'user.classrooms', component: Classrooms },
                { path: 'items', name: 'user.items', component: Items },
                { path: 'item/:id', name: 'user.itemDetail', component: ItemD },
                { path: 'loans', name: 'user.loans', component: Loans }
            ]
        },

        // ------------------- ADMIN --------------------
        {
            path: '/admin',
            component: AdminLayout,
            children: [
                { path: 'dashboard', name: 'admin.dashboard', component: SolicitudesAdmin },
                { path: 'requests', name: 'admin.requests', component: SolicitudesAdmin },
                { path: 'loans', name: 'admin.loans', component: PrestamosAdmin },
                { path: 'zones', name: 'admin.zones', component: ZonasGestion },
                { path: 'classrooms', name: 'admin.classrooms', component: AulasGestion },
                { path: 'items', name: 'admin.items', component: ItemsGestion },
                { path: 'users', name: 'admin.users', component: UsuariosGestion}
            ]
        }

    ]
});

router.beforeEach((to, from, next) => {
    if (to.meta.title) {
        document.title = `${to.meta.title} - Sistema de Inventario`;
    } else {
        document.title = 'Sistema de Inventario';
    }
    next();
});

export default router;