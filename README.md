# Sistema de inventario

Interfaz de usuario para el sistema de gestión de inventario, préstamos y solicitudes. Desarrollado con Vue 3, Quasar Framework y Vite.

# Tecnología principal

Vue / 3^3.5.24 / Framework principal
Quasar / ^2.18.6 / UI Components & Layout
Vite / ^7.2.4 / Bundler y servidor de desarrollo
Vue Router / ^4.6.3 / Navegación SPA
Pinia / ^3.0.4 / Gestión de estado global
Axios / ^1.13.2 / Cliente HTTP 
jwt-decode / ^4.0.0 / Decodificación de tokens JWT
xlsx / ^0.18.5 / Exportación a Excel

# Estructura del proyecto

src/
├── assets/
│   └── quasar-variables.sass     # Variables de estilo Quasar
├── services/
│   ├── api.js                    # Instancia de Axios con interceptores
│   └── items.js                  # Servicio de ítems
├── stores/
│   └── auth.js                   # Store de autenticación (Pinia)
├── router/
│   └── router.js                 # Definición de rutas
└── views/
    ├── Auth/                     # Vistas de interfaz de registro / inicio de sesión
    │   ├── Login.vue
    │   ├── Register.vue
    │   ├── ForgotPassword.vue
    │   └── ResetPassword.vue
    ├── User/                     # Vistas de interfaz para usuarios
    │   ├── UserLayout.vue
    │   ├── ZonasDashboard.vue
    │   ├── AulasDashboard.vue
    │   ├── ItemsDashboard.vue
    │   ├── ItemDetail.vue
    │   └── PrestamosDashboard.vue
    └── Admin/                     # Vistas de interfaz para administradores
        ├── AdminLayout.vue
        ├── ZonasGestion.vue
        ├── AulasGestion.vue
        ├── ItemsGestion.vue
        ├── PrestamosAdmin.vue
        ├── SolicitudesAdmin.vue
        └── UsuariosGestion.vue

# Roles y acceso

El sistema maneja dos roles de usuario:

- **Comun** — Puede explorar zonas, aulas e ítems, y gestionar sus propios préstamos y solicitudes.
- **Admin** — Acceso completo: CRUD de zonas, aulas e ítems, gestión de préstamos, aprobación de solicitudes y administración de usuarios.

La autenticación se basa en **JWT**. El token se almacena en `localStorage` y se decodifica con `jwt-decode` para obtener el rol e identificador del usuario.

# Rutas principales

## Públicas

`/` | Login
`/register` | Registro
`/forgot-password` | Recuperar contraseña
`/reset-password` | Restablecer contraseña

### Usuario autenticado (`/user/`)

`dashboard` | Dashboard (Zonas)
`zones` | Zonas disponibles
`classrooms` | Aulas por zona
`items` | Catálogo de ítems
`item/:id` | Detalle de ítem
`loans` | Mis préstamos

### Administrador (`/admin/`)

`zones` | Gestión de zonas
`classrooms` | Gestión de aulas
`items` | Gestión de ítems
`loans` | Gestión de préstamos
`requests` | Solicitudes pendientes
`users` | Gestión de usuarios

# Instalación y uso

## Requisitos previos

- Node.js >= 18
- npm >= 9

## Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
# Copia el archivo de ejemplo y ajusta la URL del backend
cp _env .env
# Edita VITE_API_URL con la URL de tu API

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Construir para producción
npm run build

# 5. Previsualizar build de producción
npm run preview
```


# Variables de entorno

Crea un archivo `.env` en la raíz del frontend con:

```env
VITE_API_URL=http://localhost:3000/api
```

> Las variables deben comenzar con `VITE_` para ser expuestas al cliente por Vite.


# Estado global (Pinia)

El store principal es `useAuthStore` (`stores/auth.js`), que expone:

- **Estado:** `token`, `user`
- **Getters:** `isAuthenticated`, `isAdmin`, `userName`
- **Actions:** `login()`, `register()`, `fetchUser()`, `logout()`

# Comunicación con el backend

Todas las peticiones HTTP se realizan a través de la instancia centralizada de Axios en `services/api.js`, que adjunta automáticamente el token JWT en el header `Authorization` de cada solicitud.
