<template>
    <q-page class="page-bg q-pa-md">
        <q-breadcrumbs class="text-secondary q-mb-md">
            <q-breadcrumbs-el label="Navegación" icon="view_module" to="/user/zones" class="cursor-pointer" />
            <q-breadcrumbs-el
                v-if="cart.cartAulaNombre.value"
                :label="cart.cartAulaNombre.value"
                icon="meeting_room"
                class="cursor-pointer"
                @click="goToCartAula"
            />
            <q-breadcrumbs-el label="Panel de Préstamo" icon="inventory" />
        </q-breadcrumbs>

        <div class="row items-center q-mb-lg">
            <div class="header-icon-wrap q-mr-sm">
                <q-icon name="inventory" size="22px" color="white" />
            </div>
            <div>
                <div class="text-h6 text-weight-bold text-dark">Panel de Préstamo</div>
                <div class="text-caption text-grey-6">
                    {{ cart.totalItems.value }} equipo(s) · {{ cart.totalUnidades.value }} unidad(es) en total
                </div>
                <q-chip
                    v-if="cart.cartAulaNombre.value"
                    dense square
                    color="teal-1" text-color="teal-9"
                    icon="meeting_room"
                    class="q-mt-xs q-ml-none"
                    style="cursor:pointer"
                    @click="goToCartAula"
                >
                    {{ cart.cartAulaNombre.value }}
                    <q-tooltip>Volver a este ambiente</q-tooltip>
                </q-chip>
            </div>
            <q-space />
            <q-btn v-if="!cart.isEmpty.value" flat dense no-caps color="negative" icon="delete_sweep"
                label="Vaciar panel" @click="confirmClear = true" class="q-mr-sm" />
            <q-btn flat dense no-caps color="primary" icon="add_circle_outline"
                label="Añadir más equipos" @click="goToCartAula" />
        </div>

        <div v-if="cart.isEmpty.value" class="empty-state column items-center justify-center q-py-xl">
            <q-icon name="inventory_2" size="80px" color="grey-4" />
            <div class="text-h6 text-grey-6 q-mt-md q-mb-sm">Tu panel de préstamo está vacío</div>
            <div class="text-caption text-grey-5 q-mb-lg text-center" style="max-width:320px">
                Navega por las sedes y ambientes, entra al detalle de un equipo y haz clic en
                <strong>"Añadir al panel"</strong>.
            </div>
            <q-btn color="primary" icon="view_module" label="Explorar Catálogo" to="/user/zones" unelevated />
        </div>

        <div v-else class="row q-col-gutter-lg">

            <div class="col-12 col-lg-8">
                <q-card class="cart-card" flat bordered>
                    <q-card-section class="q-pb-sm">
                        <div class="text-subtitle2 text-grey-7">Equipos seleccionados</div>
                    </q-card-section>
                    <q-separator />
                    <transition-group name="cart-list" tag="div">
                        <div v-for="entry in cart.items" :key="entry.item._id" class="cart-item-row q-pa-md">
                            <div class="row items-start q-col-gutter-md">
                                <div class="col-auto">
                                    <q-avatar size="64px" rounded class="item-avatar">
                                        <img v-if="entry.item.imagen" :src="entry.item.imagen" style="object-fit:cover" />
                                        <q-icon v-else name="inventory_2" size="32px" color="grey-5" />
                                    </q-avatar>
                                </div>
                                <div class="col">
                                    <div class="row items-center q-mb-xs">
                                        <div class="text-weight-bold text-dark text-body1 q-mr-sm">{{ entry.item.nombre }}</div>
                                        <q-badge :color="entry.item.tipo_categoria === 'Consumible' ? 'orange' : 'teal'" outline class="text-caption">
                                            {{ entry.item.tipo_categoria }}
                                        </q-badge>
                                    </div>
                                    <div class="text-caption text-grey-6 q-mb-sm">
                                        <q-icon name="map" size="12px" class="q-mr-xs" />{{ entry.item.zona?.nombre || 'N/A' }}
                                        &nbsp;·&nbsp;
                                        <q-icon name="meeting_room" size="12px" class="q-mr-xs" />{{ entry.item.aula?.nombre || 'N/A' }}
                                        &nbsp;·&nbsp;
                                        <q-icon name="inventory" size="12px" class="q-mr-xs" />{{ entry.item.cantidad_disponible }} disp.
                                    </div>
                                    <div class="row items-center q-gutter-sm q-mb-sm">
                                        <div class="text-caption text-grey-7">Cantidad:</div>
                                        <q-btn round dense flat icon="remove" size="sm" color="primary"
                                            :disable="entry.cantidad <= 1"
                                            @click="cart.updateCantidad(entry.item._id, entry.cantidad - 1)" />
                                        <q-input :model-value="entry.cantidad"
                                            @update:model-value="val => onCantidadInput(entry, val)"
                                            type="number" dense outlined min="1" :max="entry.item.cantidad_disponible"
                                            style="width:70px" input-class="text-center text-weight-bold" hide-bottom-space />
                                        <q-btn round dense flat icon="add" size="sm" color="primary"
                                            :disable="entry.cantidad >= entry.item.cantidad_disponible"
                                            @click="cart.updateCantidad(entry.item._id, entry.cantidad + 1)" />
                                        <div class="text-caption text-grey-5">/ {{ entry.item.cantidad_disponible }} max</div>
                                    </div>
                                    <q-input :model-value="entry.observacion"
                                        @update:model-value="val => cart.updateObservacion(entry.item._id, val)"
                                        dense outlined label="Observación del equipo (opcional)"
                                        maxlength="300" class="obs-input">
                                        <template v-slot:prepend>
                                            <q-icon name="comment" size="16px" color="grey-5" />
                                        </template>
                                    </q-input>
                                </div>
                                <div class="col-auto">
                                    <q-btn round flat dense icon="close" color="negative" size="sm"
                                        @click="removeEntry(entry.item._id, entry.item.nombre)">
                                        <q-tooltip>Quitar del panel</q-tooltip>
                                    </q-btn>
                                </div>
                            </div>
                            <q-separator v-if="cart.items.indexOf(entry) < cart.items.length - 1" class="q-mt-md" />
                        </div>
                    </transition-group>
                </q-card>
            </div>

            <div class="col-12 col-lg-4">
                <q-card class="summary-card" flat bordered>
                    <q-card-section>
                        <div class="text-subtitle1 text-weight-bold text-dark q-mb-md">
                            <q-icon name="summarize" class="q-mr-sm" color="primary" />
                            Resumen de solicitud
                        </div>

                        <template v-if="todoConsumible">
                            <q-banner class="bg-teal-1 text-teal-9 q-mb-md" rounded dense>
                                <template v-slot:avatar>
                                    <q-icon name="recycling" color="teal" size="18px" />
                                </template>
                                <div class="text-caption">
                                    <strong>Solo consumibles.</strong> No se requiere fecha de devolución.
                                </div>
                            </q-banner>
                        </template>
                        <template v-else>
                            <div class="text-caption text-grey-7 q-mb-xs">
                                Fecha estimada de devolución <span class="text-negative">*</span>
                            </div>
                            <q-input v-model="fechaGlobal" type="datetime-local" outlined dense
                                :min="minReturnDate" color="primary" class="q-mb-xs"
                                :error="fechaError" error-message="La fecha debe ser futura" hide-bottom-space>
                                <template v-slot:prepend>
                                    <q-icon name="event" color="primary" size="18px" />
                                </template>
                            </q-input>
                            <div class="text-caption text-grey-5 q-mb-md">El administrador puede ajustar al aprobar.</div>
                        </template>

                        <div class="text-caption text-grey-7 q-mb-xs">Destino de salida <span class="text-negative">*</span></div>
                        <q-input v-model="destinoSalida" outlined dense
                            maxlength="120" placeholder="Ej: Aula taller 3, Biblioteca, Hogar del aprendiz..." class="q-mb-sm"
                            :rules="[val => !!val?.trim() || 'Indica el destino del préstamo']"
                            hide-bottom-space lazy-rules>
                            <template v-slot:prepend>
                                <q-icon name="place" size="16px" color="primary" />
                            </template>
                        </q-input>
                        <div class="text-caption text-grey-5 q-mb-md">¿A dónde llevarás los elementos?</div>

                        <div class="text-caption text-grey-7 q-mb-xs">Observación general (opcional)</div>
                        <q-input v-model="observacionGeneral" outlined dense type="textarea" rows="2"
                            maxlength="500" placeholder="Ej: Para el proyecto final del semestre" class="q-mb-lg">
                            <template v-slot:prepend>
                                <q-icon name="comment" size="16px" color="grey-5" />
                            </template>
                        </q-input>

                        <q-list dense class="q-mb-md">
                            <q-item v-for="entry in cart.items" :key="entry.item._id" class="q-px-none">
                                <q-item-section>
                                    <q-item-label class="text-body2 ellipsis" style="max-width:180px">{{ entry.item.nombre }}</q-item-label>
                                    <q-item-label caption class="text-grey-5">{{ entry.item.aula?.nombre || '' }}</q-item-label>
                                </q-item-section>
                                <q-item-section side>
                                    <q-chip dense color="primary" text-color="white" size="sm">×{{ entry.cantidad }}</q-chip>
                                </q-item-section>
                            </q-item>
                        </q-list>

                        <q-separator class="q-mb-md" />

                        <div class="row justify-between text-body2 q-mb-xs">
                            <span class="text-grey-7">Equipos distintos</span>
                            <span class="text-weight-bold">{{ cart.totalItems.value }}</span>
                        </div>
                        <div class="row justify-between text-body2 q-mb-lg">
                            <span class="text-grey-7">Total de unidades</span>
                            <span class="text-weight-bold">{{ cart.totalUnidades.value }}</span>
                        </div>

                        <q-banner class="bg-blue-1 text-primary q-mb-md" rounded dense>
                            <template v-slot:avatar>
                                <q-icon name="info" color="primary" size="18px" />
                            </template>
                            <div class="text-caption">
                                Se generará <strong>1 solicitud</strong> con todos los equipos. El administrador la gestiona como conjunto.
                            </div>
                        </q-banner>

                        <q-btn color="primary" icon="send" label="Enviar solicitud"
                            class="full-width" size="md" unelevated
                            :disable="!canSubmit" :loading="submitting" @click="openConfirm" />

                        <div v-if="!todoConsumible && !fechaGlobal" class="text-caption text-negative text-center q-mt-xs">
                            Debes seleccionar una fecha de devolución
                        </div>
                    </q-card-section>
                </q-card>
            </div>
        </div>

        <q-dialog v-model="confirmDialog" persistent>
            <q-card style="width:500px;max-width:96%">
                <q-card-section class="row items-center bg-primary text-white">
                    <q-icon name="send" size="md" class="q-mr-sm" />
                    <div class="text-h6 text-weight-bold">Confirmar solicitud</div>
                </q-card-section>
                <q-card-section class="q-pt-lg">
                    <div class="text-body2 q-mb-md">
                        Se enviará <strong>1 solicitud</strong> con los siguientes equipos:
                    </div>
                    <q-list bordered separator class="rounded-borders q-mb-md" dense>
                        <q-item v-for="entry in cart.items" :key="entry.item._id">
                            <q-item-section avatar>
                                <q-icon name="inventory_2" color="primary" size="sm" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-medium">{{ entry.item.nombre }}</q-item-label>
                                <q-item-label caption>{{ entry.item.aula?.nombre }}</q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-badge color="primary">{{ entry.cantidad }} ud.</q-badge>
                            </q-item-section>
                        </q-item>
                    </q-list>
                    <div class="row items-center q-mb-sm">
                        <q-icon name="place" color="primary" class="q-mr-sm" />
                        <div class="text-body2">
                            <strong>Destino:</strong> {{ destinoSalida || '—' }}
                        </div>
                    </div>
                    <div class="row items-center q-mb-sm">
                        <q-icon name="event" color="primary" class="q-mr-sm" />
                        <div class="text-body2">
                            <template v-if="todoConsumible">
                                <strong>Fecha sugerida:</strong> <span class="text-grey-6">No aplica (solo consumibles)</span>
                            </template>
                            <template v-else>
                                <strong>Fecha sugerida:</strong> {{ formatDateLocal(fechaGlobal) }}
                            </template>
                        </div>
                    </div>
                    <q-banner class="bg-orange-1 text-orange-9" rounded dense>
                        <template v-slot:avatar><q-icon name="warning" color="orange" size="18px" /></template>
                        <div class="text-caption">Una vez enviada, gestiona la solicitud desde "Mis Préstamos".</div>
                    </q-banner>
                </q-card-section>
                <q-card-actions align="right" class="q-px-md q-pb-md">
                    <q-btn flat label="Cancelar" color="grey" @click="confirmDialog = false" :disable="submitting" />
                    <q-btn label="Confirmar y enviar" color="primary" icon="send" unelevated @click="submitLoan" :loading="submitting" />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <q-dialog v-model="confirmClear" persistent>
            <q-card style="width:360px;max-width:96%">
                <q-card-section class="row items-center">
                    <q-avatar icon="delete_sweep" color="negative" text-color="white" />
                    <span class="q-ml-sm text-h6">¿Vaciar panel?</span>
                </q-card-section>
                <q-card-section>Se eliminarán los <strong>{{ cart.totalItems.value }}</strong> equipo(s) del panel.</q-card-section>
                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="grey" v-close-popup />
                    <q-btn flat label="Vaciar" color="negative" @click="doClearCart" />
                </q-card-actions>
            </q-card>
        </q-dialog>

<q-dialog v-model="confirmRemove" persistent>
    <q-card style="min-width: 320px; max-width: 420px; border-radius: 14px;">
        <q-card-section class="row items-center q-pb-none">
            <q-avatar icon="delete_outline" color="negative" text-color="white" size="36px" class="q-mr-sm" />
            <span class="text-h6 text-weight-bold">¿Quitar equipo?</span>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
            ¿Deseas quitar <strong>{{ pendingRemoveName }}</strong> del panel de préstamo?
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-none">
            <q-btn flat no-caps label="Cancelar" color="grey-7" v-close-popup />
            <q-btn unelevated no-caps label="Sí, quitar" color="negative" icon="delete" @click="doRemoveEntry" />
        </q-card-actions>
    </q-card>
</q-dialog>

        <q-dialog v-model="resultDialog" persistent>
            <q-card style="width:440px;max-width:96%">
                <q-card-section class="row items-center bg-positive text-white">
                    <q-icon name="check_circle" size="md" class="q-mr-sm" />
                    <div class="text-h6 text-weight-bold">¡Solicitud enviada!</div>
                </q-card-section>
                <q-card-section class="q-pt-lg">
                    <div class="text-body2 q-mb-md">
                        Tu solicitud con <strong>{{ resultItemCount }} equipo(s)</strong> fue enviada correctamente. El administrador la revisará pronto.
                    </div>
                    <q-banner class="bg-blue-1 text-primary" rounded dense>
                        <template v-slot:avatar><q-icon name="info" color="primary" size="18px" /></template>
                        <div class="text-caption">Recibirás un correo cuando sea aprobada o rechazada.</div>
                    </q-banner>
                </q-card-section>
                <q-card-actions align="right" class="q-px-md q-pb-md">
                    <q-btn flat label="Seguir explorando" color="grey" @click="goToCatalog" />
                    <q-btn label="Ver mis préstamos" color="primary" unelevated @click="goToLoans" />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useLoanCart } from '../../services/loanCart.js';
import { loansService } from '../../services/items.js';

const router = useRouter();
const $q = useQuasar();
const cart = useLoanCart();

const fechaGlobal        = ref('');
const observacionGeneral = ref('');
const destinoSalida      = ref('');
const submitting         = ref(false);
const confirmDialog      = ref(false);
const confirmClear       = ref(false);
const resultDialog       = ref(false);
const resultItemCount    = ref(0);

const minReturnDate = computed(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
});

/** true si TODOS los ítems del carrito son Consumibles → no requiere fecha */
const todoConsumible = computed(() =>
    cart.items.length > 0 && cart.items.every(e => e.item.tipo_categoria === 'Consumible')
);

const fechaError = computed(() => {
    if (todoConsumible.value) return false;
    return fechaGlobal.value ? new Date(fechaGlobal.value) <= new Date() : false;
});
const canSubmit  = computed(() => {
    if (cart.isEmpty.value) return false;
    if (!destinoSalida.value?.trim()) return false;  // destino obligatorio siempre
    if (todoConsumible.value) return true;
    return !!fechaGlobal.value && !fechaError.value;
});

const formatDateLocal = (val) => val
    ? new Date(val).toLocaleString('es-CO', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })
    : 'No especificada';

const onCantidadInput = (entry, val) => {
    const n = parseInt(val, 10);
    if (!isNaN(n)) cart.updateCantidad(entry.item._id, n);
};

const confirmRemove      = ref(false);
const pendingRemoveId    = ref(null);
const pendingRemoveName  = ref('');

const removeEntry = (itemId, nombre) => {
    pendingRemoveId.value   = itemId;
    pendingRemoveName.value = nombre;
    confirmRemove.value     = true;
};

const doRemoveEntry = () => {
    cart.removeItem(pendingRemoveId.value);
    confirmRemove.value = false;
    $q.notify({ type: 'info', message: `"${pendingRemoveName.value}" quitado del panel`, position: 'top', timeout: 2000 });
    pendingRemoveId.value   = null;
    pendingRemoveName.value = '';
};

const doClearCart = () => {
    cart.clearCart();
    confirmClear.value = false;
    $q.notify({ type: 'info', message: 'Panel vaciado', position: 'top', timeout: 2000 });
};

const openConfirm = () => { if (canSubmit.value) confirmDialog.value = true; };

// ── 1 préstamo con N ítems ────────────────────────────────────────────────────
const submitLoan = async () => {
    submitting.value = true;
    confirmDialog.value = false;

    const payload = {
        items: cart.items.map(entry => ({
            item:              entry.item._id,
            aula:              entry.item.aula._id || entry.item.aula,
            cantidad_prestamo: entry.cantidad,
            ...(entry.observacion ? { observacion_item: entry.observacion } : {}),
        })),
        ...(fechaGlobal.value && !todoConsumible.value
            ? { fecha_sugerida_usuario: new Date(fechaGlobal.value).toISOString() }
            : {}),
        ...(observacionGeneral.value ? { observacion_solicitud: observacionGeneral.value } : {}),
        ...(destinoSalida.value?.trim() ? { destino_salida: destinoSalida.value.trim() } : {}),
    };

    try {
        await loansService.create(payload);
        resultItemCount.value    = cart.totalItems.value;
        cart.clearCart();
        observacionGeneral.value = '';
        fechaGlobal.value        = '';
        destinoSalida.value      = '';
        resultDialog.value       = true;
    } catch (err) {
        $q.notify({
            type: 'negative',
            message: err.response?.data?.message || 'No se pudo enviar la solicitud',
            position: 'top',
            timeout: 4000
        });
    } finally {
        submitting.value = false;
    }
};

const goToLoans   = () => { resultDialog.value = false; router.push('/user/loans'); };
const goToCatalog = () => { resultDialog.value = false; router.push('/user/zones'); };

/**
 * Navega de vuelta al ambiente (aula) del que provienen los ítems del carrito.
 * Si el carrito está vacío (no debería pasar), va a sedes.
 */
const goToCartAula = () => {
    const zonaId    = cart.cartZonaId.value;
    const zonaNombre = cart.cartZonaNombre.value;
    const aulaId    = cart.cartAulaId.value;
    const aulaNombre = cart.cartAulaNombre.value;

    if (aulaId && zonaId) {
        router.push({
            name: 'user.items',
            query: { zona: zonaId, zonaNombre, aula: aulaId, aulaNombre },
        });
    } else {
        router.push('/user/zones');
    }
};
</script>

<style scoped>
.page-bg { background-color:#f5f7fa;min-height:100vh; }
.header-icon-wrap {
    width:40px;height:40px;
    background:linear-gradient(135deg,#00695c,#00897b);
    border-radius:10px;display:flex;align-items:center;justify-content:center;
}
.cart-card,.summary-card { border-radius:14px;overflow:hidden; }
.summary-card { position:sticky;top:80px; }
.cart-item-row { transition:background .15s; }
.cart-item-row:hover { background:#f9fafb; }
.item-avatar { background:#eceff1;border:1px solid #e0e0e0; }
.obs-input { max-width:400px; }
.empty-state { min-height:55vh; }
.rounded-borders { border-radius:10px; }
.cart-list-enter-active,.cart-list-leave-active { transition:all .25s ease; }
.cart-list-enter-from,.cart-list-leave-to { opacity:0;transform:translateX(20px); }
</style>