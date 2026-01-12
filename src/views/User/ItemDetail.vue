<template>
    <q-page class="q-pa-lg bg-grey-2">
        <!-- Breadcrumbs -->
        <q-breadcrumbs class="text-secondary q-mb-md">
            <q-breadcrumbs-el 
                label="Zonas" 
                icon="view_module" 
                to="/user/zones" 
                class="cursor-pointer" 
            />
            <q-breadcrumbs-el 
                :label="item?.categoria?.nombre || 'Categoría'" 
                icon="map" 
                @click="goToClassrooms"
                class="cursor-pointer" 
            />
            <q-breadcrumbs-el 
                :label="item?.aula?.nombre || 'Aula'" 
                icon="meeting_room" 
                @click="goToItems"
                class="cursor-pointer" 
            />
            <q-breadcrumbs-el 
                :label="item?.nombre || 'Ítem'" 
                icon="inventory_2" 
            />
        </q-breadcrumbs>

        <!-- Loading State -->
        <div v-if="loading" class="text-center q-py-xl">
            <q-spinner-dots size="64px" color="primary" />
            <div class="text-h6 text-grey-6 q-mt-md">Cargando ítem...</div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="64px" color="negative" class="q-mb-md"/>
            <div class="text-h6 text-negative">{{ error }}</div>
            <q-btn 
                color="primary" 
                label="Volver" 
                @click="$router.back()" 
                class="q-mt-md"
            />
        </div>

        <!-- Item Detail -->
        <div v-else-if="item" class="row q-col-gutter-lg">
            <!-- Columna izquierda: Información del ítem -->
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
                                    <q-item-label class="text-weight-medium">
                                        {{ item.tipo_categoria }}
                                    </q-item-label>
                                </q-item-section>
                            </q-item>

                            <q-item>
                                <q-item-section side>
                                    <q-icon name="category" color="primary" size="sm" />
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label caption class="text-grey-6">Categoría</q-item-label>
                                    <q-item-label class="text-weight-medium">
                                        {{ item.categoria?.nombre || 'N/A' }}
                                    </q-item-label>
                                </q-item-section>
                            </q-item>

                            <q-item>
                                <q-item-section side>
                                    <q-icon name="meeting_room" color="primary" size="sm" />
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label caption class="text-grey-6">Ubicación (Aula)</q-item-label>
                                    <q-item-label class="text-weight-medium">
                                        {{ item.aula?.nombre || 'N/A' }}
                                    </q-item-label>
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
                                    <q-badge color="warning" outline>
                                        Requiere capacitación previa
                                    </q-badge>
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </q-card-section>

                    <q-card-section v-if="item.descripcion">
                        <div class="text-h6 text-secondary q-mb-sm">Descripción</div>
                        <p class="text-grey-8">{{ item.descripcion }}</p>
                    </q-card-section>

                    <q-card-section v-else>
                        <div class="text-caption text-grey-6 text-italic">
                            Sin descripción disponible
                        </div>
                    </q-card-section>
                </q-card>
            </div>

            <!-- Columna derecha: Formulario de solicitud -->
            <div class="col-12 col-md-5">
                <q-card class="shadow-2 q-pa-md sticky-card">
                    <div class="text-h5 text-weight-bold q-mb-sm text-dark">
                        Estado y Solicitud
                    </div>

                    <!-- Estado de disponibilidad -->
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
                                <div class="text-h6 text-weight-bold">
                                    {{ item.estado }}
                                </div>
                                <div class="text-subtitle1 q-mt-xs">
                                    Unidades disponibles: 
                                    <span class="text-weight-bolder">
                                        {{ item.cantidad_disponible }} / {{ item.cantidad_total_stock }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </q-card-section>

                    <!-- Formulario de solicitud -->
                    <div class="text-h6 text-secondary q-mb-md">
                        Solicitar Préstamo
                    </div>

                    <q-form @submit.prevent="openConfirmDialog" class="q-gutter-md">
                        <q-input
                            v-model.number="formData.cantidad"
                            type="number"
                            filled
                            label="Cantidad a solicitar"
                            color="primary"
                            min="1"
                            :max="item.cantidad_disponible"
                            :disable="!canRequestLoan || requestSent"
                            :rules="[
                                val => !!val || 'La cantidad es requerida',
                                val => val >= 1 || 'Debe solicitar al menos 1 unidad',
                                val => val <= item.cantidad_disponible || `Máximo disponible: ${item.cantidad_disponible}`,
                                val => Number.isInteger(val) || 'Solo cantidades enteras'
                            ]"
                        >
                            <template v-slot:prepend>
                                <q-icon name="add_shopping_cart" />
                            </template>
                        </q-input>

                        <q-banner class="bg-blue-1 text-primary" rounded dense>
                            <template v-slot:avatar>
                                <q-icon name="info" color="primary" />
                            </template>
                            La fecha estimada de devolución será asignada por el administrador al aprobar tu solicitud.
                        </q-banner>

                        <!--  Botón con skeleton cuando está procesando -->
                        <q-skeleton 
                            v-if="submitting || redirecting" 
                            type="rect" 
                            height="48px" 
                            class="rounded-borders"
                        />
                        
                        <q-btn 
                            v-else
                            type="submit" 
                            label="Enviar Solicitud" 
                            color="primary" 
                            icon="send" 
                            class="full-width"
                            :disable="!canRequestLoan || requestSent"
                        />

                        <!-- Mensaje de estado -->
                        <div v-if="!canRequestLoan && !requestSent" class="text-negative text-center text-weight-bold">
                            {{ disabledReason }}
                        </div>

                        <!-- Mensaje después de enviar solicitud -->
                        <q-banner 
                            v-if="requestSent" 
                            class="bg-positive-1 text-positive q-mt-md" 
                            rounded 
                            dense
                        >
                            <template v-slot:avatar>
                                <q-icon name="check_circle" color="positive" />
                            </template>
                            <div class="text-weight-medium">
                                ¡Solicitud enviada exitosamente!
                            </div>
                            <div class="text-caption q-mt-xs">
                                Puedes ver el estado en tus préstamos.
                            </div>
                            <template v-slot:action>
                                <q-btn 
                                    flat 
                                    dense 
                                    label="Ver Préstamos" 
                                    color="positive"
                                    @click="goToLoans"
                                    icon-right="arrow_forward"
                                />
                            </template>
                        </q-banner>

                        <q-banner v-if="requiresTraining" class="bg-warning-1 text-warning q-mt-md" rounded dense>
                            <template v-slot:avatar>
                                <q-icon name="warning" color="warning" />
                            </template>
                            <strong>Atención:</strong> Este ítem requiere capacitación previa para su uso.
                        </q-banner>
                    </q-form>
                </q-card>
            </div>
        </div>

        <!-- Dialog de confirmación -->
        <q-dialog v-model="confirmDialog" persistent>
            <q-card style="width: 450px; max-width: 95%;">
                <q-card-section class="row items-center bg-primary text-white">
                    <q-icon name="help_outline" size="md" class="q-mr-sm"/>
                    <div class="text-h6 text-weight-bold">Confirmar Solicitud de Préstamo</div>
                </q-card-section>

                <q-card-section class="q-pt-lg">
                    <div class="text-subtitle1 q-mb-md">
                        ¿Estás seguro que deseas solicitar este préstamo?
                    </div>

                    <q-list bordered separator class="rounded-borders">
                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="inventory_2" color="primary" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label caption>Ítem</q-item-label>
                                <q-item-label class="text-weight-bold">{{ item?.nombre }}</q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="shopping_cart" color="primary" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label caption>Cantidad</q-item-label>
                                <q-item-label class="text-weight-bold">
                                    {{ formData.cantidad }} unidad(es)
                                </q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="meeting_room" color="primary" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label caption>Ubicación</q-item-label>
                                <q-item-label class="text-weight-bold">{{ item?.aula?.nombre }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>

                    <q-banner class="bg-blue-1 text-primary q-mt-md" rounded dense>
                        <template v-slot:avatar>
                            <q-icon name="info" color="primary" />
                        </template>
                        <div class="text-caption">
                            Tu solicitud será enviada al administrador para su revisión. 
                            Recibirás una notificación cuando sea aprobada o rechazada.
                        </div>
                    </q-banner>
                </q-card-section>

                <q-card-actions align="right" class="q-px-md q-pb-md">
                    <q-btn 
                        flat 
                        label="Cancelar" 
                        color="grey" 
                        @click="confirmDialog = false"
                        :disable="submitting"
                    />
                    <q-btn 
                        label="Confirmar Solicitud" 
                        color="primary" 
                        icon="send"
                        @click="submitLoanRequest"
                        :loading="submitting"
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { itemsService, loansService } from '../../services/items.js';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

// Estados reactivos
const item = ref(null);
const loading = ref(false);
const error = ref(null);
const submitting = ref(false);
const redirecting = ref(false);
const requestSent = ref(false); 
const confirmDialog = ref(false);

// Datos del formulario
const formData = ref({
    cantidad: 1
});

// Computed para verificar si puede solicitar préstamo
const canRequestLoan = computed(() => {
    return item.value && item.value.estado === 'Disponible' && item.value.cantidad_disponible > 0;
});

// Computed para razón de deshabilitado
const disabledReason = computed(() => {
    if (!item.value) return '';
    if (item.value.estado === 'Agotado') return 'No hay unidades disponibles';
    if (item.value.cantidad_disponible === 0) return 'Sin stock disponible';
    return 'No puede solicitar este ítem';
});

// Computed para porcentaje de stock
const stockPercentage = computed(() => {
    if (!item.value) return 0;
    return (item.value.cantidad_disponible / item.value.cantidad_total_stock) * 100;
});

// Computed para verificar si requiere capacitación
const requiresTraining = computed(() => {
    if (!item.value) return false;
    const trainingTypes = ['De Uso Controlado', 'Herramienta de equipo'];
    return trainingTypes.includes(item.value.tipo_categoria);
});

// Función para obtener color del stock
const getStockColor = () => {
    const percentage = stockPercentage.value;
    if (percentage === 0) return 'negative';
    if (percentage < 30) return 'warning';
    if (percentage < 70) return 'info';
    return 'positive';
};

// Función para cargar el ítem
const loadItem = async () => {
    loading.value = true;
    error.value = null;
    
    try {
        const itemId = route.params.id;
        if (!itemId) {
            throw new Error('ID de ítem no proporcionado');
        }

        const data = await itemsService.getById(itemId);
        item.value = data;

        // Establecer cantidad máxima en el formulario
        if (data.cantidad_disponible > 0) {
            formData.value.cantidad = Math.min(1, data.cantidad_disponible);
        }
    } catch (err) {
        console.error('Error cargando ítem:', err);
        error.value = 'No se pudo cargar el ítem. Por favor, intenta nuevamente.';
        
        $q.notify({
            type: 'negative',
            message: 'Error al cargar el ítem',
            position: 'top',
            icon: 'error',
            timeout: 3000
        });
    } finally {
        loading.value = false;
    }
};

//  Función para abrir dialog de confirmación
const openConfirmDialog = () => {
    if (!canRequestLoan.value || requestSent.value) {
        $q.notify({
            type: 'warning',
            message: disabledReason.value,
            position: 'top',
            timeout: 2000
        });
        return;
    }

    confirmDialog.value = true;
};

// Función mejorada para enviar solicitud de préstamo
const submitLoanRequest = async () => {
    // Validaciones previas
    if (!canRequestLoan.value) {
        $q.notify({
            type: 'warning',
            message: disabledReason.value,
            position: 'top',
            timeout: 2000
        });
        confirmDialog.value = false;
        return;
    }

    // Prevenir múltiples solicitudes
    if (requestSent.value) {
        $q.notify({
            type: 'info',
            message: 'Ya has enviado una solicitud para este ítem',
            position: 'top',
            timeout: 2000
        });
        confirmDialog.value = false;
        return;
    }

    submitting.value = true;

    try {
        await loansService.create({
            item: item.value._id,
            aula: item.value.aula._id,
            cantidad_prestamo: formData.value.cantidad
        });

        // Marcar como enviada
        requestSent.value = true;
        confirmDialog.value = false;

        $q.notify({
            type: 'positive',
            message: '¡Solicitud enviada exitosamente!',
            caption: 'El administrador revisará tu solicitud pronto',
            position: 'top',
            icon: 'check_circle',
            timeout: 4000
        });

        // Resetear formulario
        formData.value = {
            cantidad: 1
        };

    } catch (err) {
        console.error('Error al crear préstamo:', err);
        
        // Permitir reintentar si hubo error
        requestSent.value = false;
        
        const errorMessage = err.response?.data?.message || 'No se pudo crear la solicitud';
        
        $q.notify({
            type: 'negative',
            message: errorMessage,
            position: 'top',
            icon: 'error',
            timeout: 4000
        });
    } finally {
        submitting.value = false;
    }
};

//  Función para ir a préstamos (controlada por el usuario)
const goToLoans = () => {
    redirecting.value = true;
    router.push('/user/loans');
};

// Funciones de navegación
const goToClassrooms = () => {
    if (item.value?.categoria) {
        router.push({
            name: 'user.classrooms',
            query: {
                categoria: item.value.categoria._id,
                categoriaNombre: item.value.categoria.nombre
            }
        });
    }
};

const goToItems = () => {
    if (item.value?.categoria && item.value?.aula) {
        router.push({
            name: 'user.items',
            query: {
                categoria: item.value.categoria._id,
                categoriaNombre: item.value.categoria.nombre,
                aula: item.value.aula._id,
                aulaNombre: item.value.aula.nombre
            }
        });
    }
};

// Cargar ítem al montar
onMounted(() => {
    loadItem();
});
</script>

<style scoped>
.rounded-borders {
    border-radius: 12px;
}

.availability-status {
    border-radius: 12px;
}

.item-details-card {
    border-radius: 12px;
}

@media (min-width: 992px) {
    .sticky-card {
        position: sticky;
        top: 85px;
    }
}
.bg-positive-1 {
    background-color: #e8f5e9;
}

.q-skeleton {
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}
</style>