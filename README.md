# 🖥️ Frontend — Sistema de Gestión de Inventario y Préstamos

SPA construida con **Vue 3 + Quasar Framework + Vite** para el Centro Agroturístico SENA Regional Santander.

---

## 📋 Tabla de Contenidos

- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Vistas y rutas](#vistas-y-rutas)
- [Gestión de estado (Pinia)](#gestión-de-estado-pinia)
- [Autenticación y guards](#autenticación-y-guards)
- [Panel de préstamo (carrito)](#panel-de-préstamo-carrito)
- [Generación de PDF](#generación-de-pdf)
- [Importación de Excel](#importación-de-excel)
- [Build para producción](#build-para-producción)

---

## Requisitos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 18.0.0 |
| npm | 9.0.0 |

El backend debe estar corriendo en `http://localhost:3000` (o configurar `VITE_API_URL`).

---

## Instalación

```bash
# Desde la raíz del frontend
npm install

# Crear archivo de variables de entorno
echo "VITE_API_URL=http://localhost:3000/api" > .env

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

---

## Variables de entorno

Crear un archivo `.env` en la raíz del frontend:

```env
# URL base de la API del backend
VITE_API_URL=http://localhost:3000/api

# Para producción (cuando el frontend y backend están en el mismo servidor):
# VITE_API_URL=/api
```

> Todas las variables de Vite deben comenzar con `VITE_` para ser accesibles en el código del cliente.

---

## Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo con Vite (HMR activo)
npm run build     # Compilar para producción (output: dist/)
npm run preview   # Vista previa del build de producción en local
```

---

## Estructura del proyecto

```
frontend/
├── src/
│   ├── assets/
│   │   ├── quasar-variables.sass  # Variables CSS personalizadas de Quasar
│   │   └── sena_logo.jpg          # Logo SENA (usado en PDF)
│   ├── components/
│   │   └── ImportarExcelDialog.vue  # Componente reutilizable de importación Excel
│   ├── router/
│   │   └── router.js              # Rutas y guards de navegación (RBAC)
│   ├── services/
│   │   ├── api.js                 # Instancia Axios con interceptor JWT
│   │   ├── items.js               # Servicios de todos los recursos (API calls)
│   │   ├── loanCart.js            # Estado del panel de préstamo (carrito)
│   │   └── loanPdfService.js      # Generación de PDF del comprobante
│   ├── views/
│   │   ├── Auth/
│   │   │   ├── Login.vue
│   │   │   ├── Register.vue
│   │   │   ├── ForgotPassword.vue
│   │   │   └── ResetPassword.vue
│   │   ├── User/
│   │   │   ├── UserLayout.vue       # Layout del usuario (drawer + header)
│   │   │   ├── ZonasDashboard.vue   # Exploración de sedes
│   │   │   ├── AulasDashboard.vue   # Ambientes de una sede
│   │   │   ├── ItemsDashboard.vue   # Ítems de un ambiente
│   │   │   ├── ItemDetail.vue       # Detalle + agregar al panel de préstamo
│   │   │   ├── PrestamosDashboard.vue  # Historial de préstamos del usuario
│   │   │   └── PanelPrestamo.vue    # Carrito y envío de solicitud
│   │   └── Admin/
│   │       ├── AdminLayout.vue      # Layout del admin (drawer + header)
│   │       ├── SolicitudesAdmin.vue # Aprobar / rechazar solicitudes
│   │       ├── PrestamosAdmin.vue   # Gestión de todos los préstamos
│   │       ├── ZonasGestion.vue     # CRUD de sedes
│   │       ├── AulasGestion.vue     # CRUD de ambientes
│   │       ├── ItemsGestion.vue     # CRUD de materiales
│   │       ├── EquiposGestion.vue   # CRUD de equipos/maquinaria
│   │       ├── UsuariosGestion.vue  # Gestión de usuarios y roles
│   │       ├── CuentadantesGestion.vue  # CRUD de cuentadantes
│   │       └── ArchivoAdmin.vue     # Ver y reactivar elementos inhabilitados
├── App.vue                # Componente raíz con <router-view>
├── main.js                # Punto de entrada: registra Vue, Quasar, Router
├── vite.config.js         # Configuración de Vite + Quasar plugin
├── package.json
└── .env                   # Variables de entorno (no subir al repo)
```

---

## Vistas y rutas

### Rutas públicas

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | Login.vue | Formulario de inicio de sesión con redirección por rol. |
| `/register` | Register.vue | Registro de nuevos usuarios. |
| `/forgot-password` | ForgotPassword.vue | Recuperar contraseña por email o buscar cuenta por nombre. |
| `/reset-password?token=...` | ResetPassword.vue | Establecer nueva contraseña con token válido. |

### Rutas de usuario (rol: Comun)

| Ruta | Componente | Descripción |
|---|---|---|
| `/user/zones` | ZonasDashboard.vue | Tarjetas de sedes disponibles. |
| `/user/classrooms?zona=&zonaNombre=` | AulasDashboard.vue | Lista de ambientes de una sede. |
| `/user/items?zona=&aula=` | ItemsDashboard.vue | Ítems del ambiente con filtros. |
| `/user/item/:id` | ItemDetail.vue | Detalle del ítem, stock en tiempo real y botón "Añadir al panel". |
| `/user/cart` | PanelPrestamo.vue | Panel de préstamo: revisar ítems, indicar fecha y enviar solicitud. |
| `/user/loans` | PrestamosDashboard.vue | Historial de préstamos con filtros, notificación de devoluciones y descarga de PDF. |

### Rutas de administrador (rol: Admin o SuperAdmin)

| Ruta | Componente | Descripción |
|---|---|---|
| `/admin/requests` | SolicitudesAdmin.vue | Solicitudes pendientes — aprobar, rechazar, ajustar cantidades. |
| `/admin/loans` | PrestamosAdmin.vue | Todos los préstamos con gestión de devoluciones, aplazamiento y exportación Excel. |
| `/admin/zones` | ZonasGestion.vue | CRUD de sedes. |
| `/admin/classrooms` | AulasGestion.vue | CRUD de ambientes. |
| `/admin/items` | ItemsGestion.vue | CRUD de materiales (consumibles y de uso controlado). |
| `/admin/equipos` | EquiposGestion.vue | CRUD de equipos y maquinaria (con placa SENA). |
| `/admin/users` | UsuariosGestion.vue | Listado y gestión de roles de usuario. |
| `/admin/cuentadantes` | CuentadantesGestion.vue | CRUD de cuentadantes. |
| `/admin/archivo` | ArchivoAdmin.vue | Ver elementos inhabilitados y reactivarlos (solo SuperAdmin). |

---

## Gestión de estado (Pinia)

### `loanCart.js` — Panel de préstamo

El carrito de préstamo **no usa un store de Pinia** formal, sino un módulo reactivo (`reactive` + `computed`) que se exporta como composable `useLoanCart()`. Se persiste automáticamente en `localStorage` con la clave `loan_cart_<userId>`.

```javascript
import { useLoanCart } from '@/services/loanCart.js';

const cart = useLoanCart();

cart.addItem(item, cantidad, observacion);  // 'added' | 'updated' | 'wrong_aula'
cart.updateCantidad(itemId, nuevaCantidad);
cart.removeItem(itemId);
cart.clearCart();          // Limpia y persiste
cart.clearCartMemory();    // Solo limpia memoria (al hacer logout)
cart.initForUser(userId);  // Carga el carrito del usuario que acaba de entrar

// Computed
cart.totalItems.value      // Cantidad de ítems distintos
cart.totalUnidades.value   // Suma de todas las cantidades
cart.isEmpty.value
cart.cartAulaId.value      // ID del ambiente del carrito (todos deben ser del mismo)
cart.cartAulaNombre.value
```

> **Regla de negocio:** todos los ítems de un mismo panel de préstamo deben pertenecer al **mismo ambiente**. Intentar agregar un ítem de otro ambiente devuelve `'wrong_aula'`.

---

## Autenticación y guards

El archivo `router.js` incluye un guard `beforeEach` que:

1. Redirige al login si la ruta requiere autenticación y no hay token en `localStorage`.
2. Redirige al dashboard correspondiente si el usuario ya está autenticado e intenta acceder a `/` o `/register`.
3. Bloquea el acceso a rutas de admin para usuarios con rol `Comun`.

```javascript
// Ejemplo de ruta protegida
{
  path: '/admin',
  component: AdminLayout,
  meta: { requiresAdmin: true },
  children: [...]
}
```

El interceptor de **Axios** en `services/api.js` inyecta automáticamente el JWT en el header `Authorization` de cada petición y redirige al login si la API devuelve `401`.

---

## Panel de préstamo (carrito)

El flujo completo de una solicitud:

```
ItemDetail.vue
  └─→ useLoanCart().addItem(item, cantidad)
        └─→ PanelPrestamo.vue
              ├─ Revisar ítems, ajustar cantidades
              ├─ Indicar destino de salida (obligatorio)
              ├─ Indicar fecha sugerida (obligatorio si no son todos consumibles)
              └─ loansService.create(payload)  →  POST /api/prestamos
```

El panel muestra un `q-badge` en el header y en el ítem de menú mientras haya ítems pendientes de enviar.

---

## Generación de PDF

El archivo `services/loanPdfService.js` genera el **comprobante de autorización de salida** en el cliente usando **jsPDF** (cargado dinámicamente desde CDN).

```javascript
import { generarPdfSalida } from '@/services/loanPdfService.js';

// Desde cualquier componente:
await generarPdfSalida(loanObject);
// → Descarga automática: autorizacion_salida_<ID>.pdf
```

El PDF incluye: encabezado institucional SENA, tabla de ítems, datos del cuentadante, fechas, destino de salida, firma de vigilancia y portería.

---

## Importación de Excel

El componente `components/ImportarExcelDialog.vue` es reutilizable y soporta dos modos:

```vue
<!-- Para materiales (consumibles / uso controlado) -->
<ImportarExcelDialog modulo="materiales" @importado="loadItems" />

<!-- Para equipos y maquinaria -->
<ImportarExcelDialog modulo="equipos" @importado="loadItems" />
```

**Columnas del archivo Excel:**

| Columna | Obligatorio | Descripción |
|---|:---:|---|
| `nombre` | ✓ | Nombre del ítem (máx. 150 car.) |
| `cantidad_total_stock` | ✓ | Número entero ≥ 0 |
| `numero_placa` | Solo equipos | Placa SENA única |
| `codigo_unspsc` | — | 8 dígitos (Ej: 44111905) |
| `descripcion` | — | Descripción técnica |
| `unidad_medida` | — | Ej: Unidad, Caja, Kit |
| `presentacion` | — | Ej: Caja x 12 unidades |

La categoría, sede, ambiente y cuentadante se asignan desde el panel de importación (no van en el Excel).

---

## Build para producción

```bash
# Configurar VITE_API_URL antes del build
echo "VITE_API_URL=/api" > .env.production

# Generar build optimizado
npm run build
# → Archivos estáticos en dist/

# Copiar al backend para servir desde el mismo servidor
cp -r dist/ ../backend/public/
```

El backend está configurado para servir `public/index.html` como fallback SPA para todas las rutas no-API, por lo que no se necesita un servidor web adicional en despliegue simple.

### Vista previa local del build

```bash
npm run preview
# → http://localhost:4173
```

---

## Tecnologías principales

| Librería | Versión | Uso |
|---|---|---|
| Vue.js 3 | ^3.5 | Framework principal, Composition API |
| Quasar Framework | ^2.18 | Componentes UI Material Design, responsivo |
| Vue Router 4 | ^4.6 | Enrutamiento con guards RBAC |
| Pinia | ^3.0 | Gestión de estado global (loanCart) |
| Axios | ^1.13 | Cliente HTTP con interceptor JWT |
| Vite | ^7.2 | Build tool, dev server con HMR |
| Sheet.JS (xlsx) | ^0.18 | Importación/exportación de archivos Excel |
| jwt-decode | ^4.0 | Decodificación del JWT para extraer rol/userId |
| jsPDF | 2.5.1 | Generación de PDF del comprobante (CDN) |

---

*Centro Agroturístico SENA · Regional Santander · 2026*