<template>
    <q-page class="q-pa-lg bg-grey-2">
        <q-breadcrumbs class="text-secondary q-mb-md">
            <q-breadcrumbs-el label="Sedes" icon="view_module" to="/user/zones" class="cursor-pointer" />
            <q-breadcrumbs-el
                :label="item?.zona?.nombre || 'Sede'"
                icon="map"
                @click="goToClassrooms"
                class="cursor-pointer"
            />
            <q-breadcrumbs-el
                :label="item?.aula?.nombre || 'Ambiente'"
                icon="meeting_room"
                @click="goToItems"
                class="cursor-pointer"
            />
            <q-breadcrumbs-el :label="item?.nombre || 'equipo'" icon="inventory_2" />
        </q-breadcrumbs>

        <!-- Loading -->
        <div v-if="loading" class="text-center q-py-xl">
            <q-spinner-dots size="64px" color="primary" />
            <div class="text-h6 text-grey-6 q-mt-md">Cargando equipo...</div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="64px" color="negative" class="q-mb-md" />
            <div class="text-h6 text-negative">{{ error }}</div>
            <q-btn color="primary" label="Volver" @click="$router.back()" class="q-mt-md" />
        </div>

        <!-- Contenido -->
        <div v-else-if="item" class="row q-col-gutter-lg">

            <!-- ── Columna izquierda: info del ítem ────────────────────────── -->
            <div class="col-12 col-md-7">
                <div class="text-h4 text-weight-bold text-dark q-mb-lg">
                    {{ item.nombre }}
                </div>

                <q-card class="shadow-2 q-mb-lg item-details-card">
                    <q-img
                        :src="item.imagen || 'https://via.placeholder.com/800x400?text=Sin+Imagen'"
                        height="350px"
                        fit="cover"
                        spinner-color="primary"
                    >
                        <div class="absolute-bottom text-h6 text-white bg-transparent">
                            <q-badge
                                :color="item.estado === 'Disponible' ? 'positive' : 'negative'"
                                class="q-ma-md text-body1"
                            >
                                {{ item.estado }}
                            </q-badge>
                        </div>
                    </q-img>

                    <q-card-section>
                        <q-list separator class="q-mt-sm">
                            <q-item>
                                <q-item-section side>
                                    <q-icon name="label" color="primary" size="sm" />
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label caption class="text-grey-6">Tipo</q-item-label>
                                    <q-item-label class="text-weight-medium">{{ item.tipo_categoria }}</q-item-label>
                                </q-item-section>
                            </q-item>

                            <q-item v-if="item.tipo_categoria === 'Equipo O Maquinaria' && item.numero_placa">
                                <q-item-section side>
                                    <q-icon name="qr_code_2" color="deep-purple-6" size="sm" />
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label caption class="text-grey-6">Placa SENA</q-item-label>
                                    <q-item-label class="text-weight-medium">
                                        <q-badge
                                            color="deep-purple-1"
                                            text-color="deep-purple-9"
                                            style="font-size:13px;padding:4px 10px;border-radius:8px;font-weight:600;letter-spacing:.5px;"
                                        >
                                            {{ item.numero_placa }}
                                        </q-badge>
                                    </q-item-label>
                                </q-item-section>
                            </q-item>

                            <q-item>
                                <q-item-section side>
                                    <q-icon name="category" color="primary" size="sm" />
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label caption class="text-grey-6">Sede</q-item-label>
                                    <q-item-label class="text-weight-medium">{{ item.zona?.nombre || 'N/A' }}</q-item-label>
                                </q-item-section>
                            </q-item>

                            <q-item>
                                <q-item-section side>
                                    <q-icon name="meeting_room" color="primary" size="sm" />
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label caption class="text-grey-6">Ubicación (Ambiente)</q-item-label>
                                    <q-item-label class="text-weight-medium">{{ item.aula?.nombre || 'N/A' }}</q-item-label>
                                </q-item-section>
                            </q-item>

                            <q-item>
                                <q-item-section side>
                                    <q-icon name="inventory" color="primary" size="sm" />
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label caption class="text-grey-6">Stock</q-item-label>
                                    <q-item-label class="text-weight-medium">
                                        {{ item.cantidad_disponible }} disponible(s) de {{ item.cantidad_total_stock }} total(es)
                                    </q-item-label>
                                    <q-linear-progress
                                        :value="stockPercentage / 100"
                                        :color="getStockColor()"
                                        size="8px"
                                        class="q-mt-sm"
                                    />
                                </q-item-section>
                            </q-item>

                            <q-item v-if="requiresTraining">
                                <q-item-section side>
                                    <q-icon name="school" color="warning" size="sm" />
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label caption class="text-grey-6">Capacitación</q-item-label>
                                    <q-badge color="warning" outline>Requiere capacitación previa</q-badge>
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </q-card-section>

                    <q-card-section v-if="item.descripcion">
                        <div class="text-h6 text-secondary q-mb-sm">Descripción</div>
                        <p class="text-grey-8">{{ item.descripcion }}</p>
                    </q-card-section>
                    <q-card-section v-else>
                        <div class="text-caption text-grey-6 text-italic">Sin descripción disponible</div>
                    </q-card-section>
                </q-card>
            </div>

            <!-- ── Columna derecha: añadir al panel ───────────────────────── -->
            <div class="col-12 col-md-5">
                <q-card class="shadow-2 q-pa-md sticky-card">
                    <div class="text-h5 text-weight-bold q-mb-sm text-dark">
                        Estado y Solicitud
                    </div>

                    <!-- Chip de disponibilidad -->
                    <q-card-section
                        :class="`q-pa-md rounded-borders text-white q-mb-lg availability-status ${
                            item.estado === 'Disponible' ? 'bg-positive' : 'bg-negative'
                        }`"
                    >
                        <div class="row items-center">
                            <q-icon
                                :name="item.estado === 'Disponible' ? 'check_circle' : 'cancel'"
                                size="lg"
                                class="q-mr-md"
                            />
                            <div>
                                <div class="text-h6 text-weight-bold">{{ item.estado }}</div>
                                <div class="text-subtitle1 q-mt-xs">
                                    Unidades disponibles:
                                    <span class="text-weight-bolder">
                                        {{ item.cantidad_disponible }} / {{ item.cantidad_total_stock }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </q-card-section>

                    <!-- Banner: ya está en el carrito -->
                    <q-banner
                        v-if="alreadyInCart"
                        class="bg-teal-1 text-teal-9 q-mb-md rounded-borders"
                        dense
                    >
                        <template v-slot:avatar>
                            <q-icon name="inventory" color="teal" />
                        </template>
                        <div class="text-weight-medium">Ya está en tu panel de préstamo</div>
                        <div class="text-caption">Cantidad actual: {{ cartEntry?.cantidad }} unidad(es)</div>
                        <template v-slot:action>
                            <q-btn
                                flat dense no-caps
                                label="Ver panel"
                                color="teal"
                                icon-right="arrow_forward"
                                to="/user/cart"
                            />
                        </template>
                    </q-banner>

                    <!-- Título sección -->
                    <div class="text-h6 text-secondary q-mb-md">
                        {{ alreadyInCart ? 'Edita la cantidad desde el panel' : 'Añadir al panel de préstamo' }}
                    </div>

                    <!-- ── Formulario: solo cuando NO está en el carrito ── -->
                    <div v-if="!alreadyInCart">

                        <!-- Selector de cantidad -->
                        <div class="row items-center q-mb-xs">
                            <div class="row items-center no-wrap q-gutter-xs">
                                <q-btn
                                    round dense flat icon="remove" size="md" color="primary"
                                    :disable="!canAddToCart || formCantidad <= 1"
                                    @click="formCantidad = Math.max(1, formCantidad - 1)"
                                />

                                <!-- Sin min / max / rules ni autocorrección -->
                                <q-input
                                    v-model.number="formCantidad"
                                    type="number"
                                    outlined
                                    dense
                                    label="Cantidad"
                                    color="primary"
                                    :disable="!canAddToCart"
                                    style="width: 140px"
                                    input-class="text-center text-weight-bold text-h6"
                                    hide-bottom-space
                                >
                                    <template v-slot:prepend>
                                        <q-icon name="add_box" size="sm" />
                                    </template>
                                    <template v-slot:append>
                                        <span class="text-grey-6 text-caption">/ {{ item.cantidad_disponible }}</span>
                                    </template>
                                </q-input>

                                <q-btn
                                    round dense flat icon="add" size="md" color="primary"
                                    :disable="!canAddToCart || formCantidad >= item.cantidad_disponible"
                                    @click="formCantidad = Math.min(item.cantidad_disponible, formCantidad + 1)"
                                />
                            </div>
                        </div>

                        <!-- Mensaje de error — visible pero sin corregir el valor -->
                        <div v-if="cantidadError" class="text-negative text-caption q-mb-md q-ml-xs row items-center no-wrap">
                            <q-icon name="warning" size="xs" class="q-mr-xs" />
                            {{ cantidadError }}
                        </div>
                        <div v-else class="q-mb-md" />

                        <!-- Observación -->
                        <q-input
                            v-model="formObservacion"
                            filled
                            label="Observación (opcional)"
                            type="textarea"
                            rows="2"
                            color="primary"
                            maxlength="300"
                            counter
                            :disable="!canAddToCart"
                            placeholder="Ej: Necesito el equipo para el proyecto del martes"
                            class="q-mb-md"
                        >
                            <template v-slot:prepend>
                                <q-icon name="comment" color="primary" />
                            </template>
                        </q-input>

                        <!-- Aviso capacitación -->
                        <q-banner v-if="requiresTraining" class="bg-warning-1 text-warning q-mb-md" rounded dense>
                            <template v-slot:avatar>
                                <q-icon name="warning" color="warning" />
                            </template>
                            <strong>Atención:</strong> Este equipo requiere capacitación previa para su uso.
                        </q-banner>

                        <!-- Motivo deshabilitado por stock -->
                        <div v-if="!canAddToCart" class="text-negative text-center text-weight-bold q-mb-md">
                            {{ disabledReason }}
                        </div>

                        <!-- Botón añadir — bloqueado si hay error de cantidad -->
                        <q-btn
                            label="Añadir al panel de préstamo"
                            icon="add_box"
                            color="primary"
                            class="full-width q-mb-sm"
                            unelevated
                            :disable="!canAddToCart || !!cantidadError"
                            @click="handleAddToCart"
                        />
                    </div>

                    <!-- ── Cuando ya está en el carrito: recordatorio ── -->
                    <div v-else class="q-mb-md">
                        <q-banner class="bg-blue-1 text-blue-9 rounded-borders" dense>
                            <template v-slot:avatar>
                                <q-icon name="info" color="blue-7" />
                            </template>
                            Puedes modificar la cantidad directamente desde el panel de préstamo.
                        </q-banner>
                    </div>

                    <!-- Ir al panel -->
                    <q-btn
                        v-if="alreadyInCart || cartTotalItems > 0"
                        label="Ir al panel de préstamo"
                        icon-right="inventory"
                        color="secondary"
                        outline
                        class="full-width"
                        to="/user/cart"
                    >
                        <q-badge
                            v-if="cartTotalItems > 0"
                            color="primary"
                            :label="cartTotalItems"
                            floating
                        />
                    </q-btn>

                    <!-- Enlace a mis préstamos -->
                    <q-btn
                        flat
                        dense
                        no-caps
                        color="grey-7"
                        label="Ver mis préstamos"
                        icon-right="arrow_forward"
                        class="full-width q-mt-sm"
                        @click="$router.push('/user/loans')"
                    />
                </q-card>
            </div>
        </div>
    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { itemsService } from '../../services/items.js';
import { useLoanCart } from '../../services/loanCart.js';

const route  = useRoute();
const router = useRouter();
const $q     = useQuasar();
const cart   = useLoanCart();

// ── State ─────────────────────────────────────────────────────────────────────
const item    = ref(null);
const loading = ref(false);
const error   = ref(null);

const formCantidad    = ref(1);
const formObservacion = ref('');

// ── Computed ──────────────────────────────────────────────────────────────────
const alreadyInCart  = computed(() => item.value ? cart.hasItem(item.value._id) : false);
const cartEntry      = computed(() => item.value ? cart.getEntry(item.value._id) : null);
const cartTotalItems = computed(() => cart.totalItems.value);

const canAddToCart = computed(() =>
    item.value &&
    item.value.estado === 'Disponible' &&
    item.value.cantidad_disponible > 0
);

const disabledReason = computed(() => {
    if (!item.value) return '';
    if (item.value.estado === 'Agotado') return 'No hay unidades disponibles';
    if (item.value.cantidad_disponible === 0) return 'Sin stock disponible';
    return 'No puede solicitar este equipo';
});

// Valida sin modificar formCantidad — devuelve mensaje de error o cadena vacía
const cantidadError = computed(() => {
    if (!item.value) return '';
    const val = formCantidad.value;
    if (val === null || val === '' || isNaN(Number(val))) return 'Ingresa una cantidad válida';
    const n = Number(val);
    if (!Number.isInteger(n))               return 'La cantidad debe ser un número entero';
    if (n < 1)                              return 'La cantidad mínima es 1 unidad';
    if (n > item.value.cantidad_disponible) return `Solo hay ${item.value.cantidad_disponible} unidad(es) disponible(s)`;
    return '';
});

const stockPercentage = computed(() => {
    if (!item.value) return 0;
    return (item.value.cantidad_disponible / item.value.cantidad_total_stock) * 100;
});

const requiresTraining = computed(() => {
    if (!item.value) return false;
    return ['De Uso Controlado', 'Herramienta de equipo'].includes(item.value.tipo_zona);
});

// ── Métodos ───────────────────────────────────────────────────────────────────
const getStockColor = () => {
    const p = stockPercentage.value;
    if (p === 0) return 'negative';
    if (p < 30)  return 'warning';
    if (p < 70)  return 'info';
    return 'positive';
};

const handleAddToCart = () => {
    if (!canAddToCart.value || cantidadError.value) return;

    const action = cart.addItem(item.value, formCantidad.value, formObservacion.value);

    if (action === 'added') {
        $q.notify({
            type: 'positive',
            message: `"${item.value.nombre}" añadido al panel`,
            caption: 'Puedes seguir añadiendo equipos o ir al panel para enviar tu solicitud',
            position: 'top',
            icon: 'add_box',
            timeout: 3500,
            actions: [
                {
                    label: 'Ir al panel',
                    color: 'white',
                    handler: () => router.push('/user/cart')
                }
            ]
        });
    } else {
        $q.notify({
            type: 'info',
            message: `Cantidad actualizada a ${cart.getEntry(item.value._id)?.cantidad} unidad(es)`,
            position: 'top',
            icon: 'edit',
            timeout: 2500,
        });
    }
};

const loadItem = async () => {
    loading.value = true;
    error.value = null;
    try {
        const itemId = route.params.id;
        if (!itemId) throw new Error('ID de equipo no proporcionado');
        const data = await itemsService.getById(itemId);
        item.value = data;
        const entry = cart.getEntry(data._id);
        if (entry) {
            formCantidad.value    = entry.cantidad;
            formObservacion.value = entry.observacion || '';
        } else if (data.cantidad_disponible > 0) {
            formCantidad.value = 1;
        }
    } catch (err) {
        console.error('Error cargando equipo:', err);
        error.value = 'No se pudo cargar el equipo. Por favor, intenta nuevamente.';
        $q.notify({ type: 'negative', message: 'Error al cargar el equipo', position: 'top', timeout: 3000 });
    } finally {
        loading.value = false;
    }
};

const goToClassrooms = () => {
    if (item.value?.zona) {
        router.push({ name: 'user.classrooms', query: { zona: item.value.zona._id, zonaNombre: item.value.zona.nombre } });
    }
};

const goToItems = () => {
    if (item.value?.zona && item.value?.aula) {
        router.push({ name: 'user.items', query: { zona: item.value.zona._id, zonaNombre: item.value.zona.nombre, aula: item.value.aula._id, aulaNombre: item.value.aula.nombre } });
    }
};

onMounted(() => {
    loadItem();
});
</script>

<style scoped>
.rounded-borders     { border-radius: 12px; }
.availability-status { border-radius: 12px; }
.item-details-card   { border-radius: 12px; }

@media (min-width: 992px) {
    .sticky-card {
        position: sticky;
        top: 85px;
    }
}

.bg-positive-1 { background-color: #e8f5e9; }
</style>