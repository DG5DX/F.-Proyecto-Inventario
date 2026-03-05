<template>
    <q-page class="page-bg q-pa-md q-pa-sm-lg">

        <!-- ── Header ──────────────────────────────────────────── -->
        <div class="page-header q-mb-md row items-center justify-between">
            <div class="row items-center gap-3" style="gap:12px">
                <div class="header-icon-wrap">
                    <q-icon name="assignment" color="white" size="20px"/>
                </div>
                <div class="lh-tight">
                    <div class="text-h6 text-weight-bold text-grey-9">Mis Préstamos</div>
                    <div class="text-caption text-grey-5">Historial y estado de tus solicitudes</div>
                </div>
            </div>
            <q-btn class="action-btn" color="primary" icon="refresh" label="Actualizar" outline size="sm" @click="loadLoans" :loading="loading"/>
        </div>

        <!-- ── Stat chips ───────────────────────────────────────── -->
        <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-6 col-sm-3">
                <div class="stat-chip stat-chip--grey" :class="{ 'stat-chip--active': estadoFiltro === 'Pendiente' }" @click="estadoFiltro = estadoFiltro === 'Pendiente' ? null : 'Pendiente'">
                    <q-icon name="pending" size="18px"/>
                    <div class="stat-number">{{ countByStatus('Pendiente') }}</div>
                    <div class="stat-label">Pendientes</div>
                </div>
            </div>
            <div class="col-6 col-sm-3">
                <div class="stat-chip stat-chip--green" :class="{ 'stat-chip--active': estadoFiltro === 'Aprobado' }" @click="estadoFiltro = estadoFiltro === 'Aprobado' ? null : 'Aprobado'">
                    <q-icon name="check_circle" size="18px"/>
                    <div class="stat-number">{{ countByStatus('Aprobado') }}</div>
                    <div class="stat-label">Aprobados</div>
                </div>
            </div>
            <div class="col-6 col-sm-3">
                <div class="stat-chip stat-chip--red" :class="{ 'stat-chip--active': estadoFiltro === 'Vencido' }" @click="estadoFiltro = estadoFiltro === 'Vencido' ? null : 'Vencido'">
                    <q-icon name="alarm_off" size="18px"/>
                    <div class="stat-number">{{ overdueCount }}</div>
                    <div class="stat-label">Vencidos</div>
                </div>
            </div>
            <div class="col-6 col-sm-3">
                <div class="stat-chip stat-chip--blue" :class="{ 'stat-chip--active': estadoFiltro === 'Devuelto' }" @click="estadoFiltro = estadoFiltro === 'Devuelto' ? null : 'Devuelto'">
                    <q-icon name="assignment_turned_in" size="18px"/>
                    <div class="stat-number">{{ countByStatus('Devuelto') }}</div>
                    <div class="stat-label">Devueltos</div>
                </div>
            </div>
        </div>

        <!-- ── Filter bar ─────────────────────────────────────── -->
        <div class="filter-bar q-mb-md">
            <div class="filter-bar__inner">
                <button v-for="tab in filterTabs" :key="tab.value ?? 'all'" class="filter-tab" :class="{ 'filter-tab--active': estadoFiltro === tab.value }" @click="estadoFiltro = tab.value">
                    <q-icon :name="tab.icon" size="14px"/>
                    {{ tab.label }}
                    <span v-if="tab.count > 0" class="filter-tab__badge">{{ tab.count }}</span>
                </button>
            </div>
        </div>

        <!-- ── Loading / Error / Empty ─────────────────────────── -->
        <div v-if="loading && !loans.length" class="text-center q-py-xl">
            <q-spinner-dots size="64px" color="primary" />
            <div class="text-h6 text-grey-6 q-mt-md">Cargando préstamos...</div>
        </div>
        <div v-else-if="error" class="text-center q-py-xl">
            <q-icon name="error_outline" size="64px" color="negative" class="q-mb-md"/>
            <div class="text-h6 text-negative">{{ error }}</div>
            <q-btn color="primary" label="Reintentar" @click="loadLoans" class="q-mt-md"/>
        </div>
        <div v-else-if="filteredLoans.length === 0" class="text-center q-py-xl">
            <q-icon name="inventory_2" size="64px" color="grey-5" class="q-mb-md"/>
            <div class="text-h6 text-grey-7">
                {{ estadoFiltro === 'Vencido' ? '¡Sin préstamos vencidos! Todo al día.' : estadoFiltro ? `No tienes préstamos ${estadoFiltro.toLowerCase()}s` : 'No tienes préstamos registrados' }}
            </div>
            <div class="text-subtitle1 text-grey-6 q-mb-lg">
                {{ estadoFiltro ? 'Intenta cambiar el filtro para ver otros préstamos' : 'Explora el catálogo y solicita tu primer préstamo' }}
            </div>
            <q-btn color="primary" label="Explorar Catálogo" icon="view_module" @click="router.push('/user/zones')"/>
        </div>

        <!-- ── Table ────────────────────────────────────────────── -->
        <div v-else class="table-card">
            <div class="row items-center q-px-md q-pt-md q-pb-sm">
                <div class="text-subtitle2 text-grey-7">{{ filteredLoans.length }} préstamo(s)</div>
                <q-space/>
                <q-input v-model="searchFilter" dense borderless placeholder="Buscar por equipo..." class="search-input" clearable>
                    <template v-slot:prepend><q-icon name="search" size="18px" color="grey-5"/></template>
                </q-input>
            </div>
            <q-separator/>
            <q-table
                :rows="filteredLoans"
                :columns="columns"
                row-key="_id"
                :filter="searchFilter"
                :loading="loading"
                :rows-per-page-options="[10, 25, 50]"
                no-data-label="No hay préstamos."
                :row-class="getRowClass"
                flat
                class="data-table"
            >
                <!-- Equipo: itera los items del préstamo -->
                <template v-slot:body-cell-item="props">
                    <q-td :props="props">
                        <div v-for="(li, idx) in props.row.items?.filter(i => i.estado_item !== 'Eliminado' && i.estado_item !== 'Rechazado')" :key="li._id" :class="idx > 0 ? 'q-mt-xs' : ''">
                            <div class="cell-primary text-weight-medium">{{ li.item?.nombre || 'N/A' }}</div>
                            <div class="cell-secondary">{{ li.aula?.nombre || 'N/A' }}</div>
                            <span v-if="li.item?.tipo_categoria" class="tipo-badge" :class="`tipo-badge--${li.item.tipo_categoria === 'Consumible' ? 'orange' : li.item.tipo_categoria === 'De Uso Controlado' ? 'purple' : 'blue'}`">
                                {{ li.item.tipo_categoria }}
                            </span>
                        </div>
                    </q-td>
                </template>

                <!-- Cantidad: una por item -->
                <template v-slot:body-cell-cantidad="props">
                    <q-td :props="props" class="text-center">
                        <div v-for="li in props.row.items?.filter(i => i.estado_item !== 'Eliminado' && i.estado_item !== 'Rechazado')" :key="li._id">
                            <q-chip dense size="sm" color="blue-grey-1" text-color="blue-grey-8" icon="inventory_2" style="font-size:11px">
                                {{ li.cantidad_aprobada ?? li.cantidad_prestamo }}
                            </q-chip>
                        </div>
                    </q-td>
                </template>

                <!-- F. Solicitud -->
                <template v-slot:body-cell-fecha_solicitud="props">
                    <q-td :props="props" class="text-center">
                        <div class="cell-primary">{{ formatDate(props.row.fecha_solicitud) }}</div>
                    </q-td>
                </template>

                <!-- F. Devolución -->
                <template v-slot:body-cell-fecha_estimada="props">
                    <q-td :props="props" class="text-center">
                        <div v-if="props.row.fecha_estimada">
                            <div class="cell-primary" :class="isOverdue(props.row) ? 'text-negative text-weight-bold' : ''">
                                {{ formatDate(props.row.fecha_estimada) }}
                            </div>
                            <div v-if="isOverdue(props.row)" class="overdue-pill q-mt-xs">
                                <q-icon name="alarm_off" size="10px" class="q-mr-xs"/>VENCIDO
                            </div>
                        </div>
                        <span v-else class="text-grey-4">—</span>
                    </q-td>
                </template>

                <!-- Estado -->
                <template v-slot:body-cell-status="props">
                    <q-td :props="props" class="text-center">
                        <span class="status-badge" :class="`status-badge--${isOverdue(props.row) ? 'vencido' : getLoanDisplayEstado(props.row).css}`">
                            {{ isOverdue(props.row) ? 'Vencido' : getLoanDisplayEstado(props.row).label }}
                        </span>
                    </q-td>
                </template>

                <!-- ══ ACCIONES: lógica multi-item corregida ══ -->
                <template v-slot:body-cell-actions="props">
                    <q-td :props="props">

                        <!-- Pendiente -->
                        <div v-if="props.row.estado === 'Pendiente'" class="text-center">
                            <q-btn icon="schedule" label="Esperando" color="grey" size="sm" flat dense disable>
                                <q-tooltip>Esperando aprobación del administrador</q-tooltip>
                            </q-btn>
                        </div>

                        <!-- Activo: itera cada sub-item con estado_item === 'Aprobado' -->
                        <div v-else-if="['Aprobado', 'Aplazado'].includes(props.row.estado)">
                            <!-- Botón PDF autorización de salida -->
                            <div class="q-mb-sm text-center">
                                <q-btn
                                    icon="picture_as_pdf"
                                    label="Autorización de salida"
                                    color="negative" size="sm" outline dense
                                    @click="generarPdfSalida(props.row)"
                                >
                                    <q-tooltip>Descargar autorización de salida para mostrar en portería</q-tooltip>
                                </q-btn>
                            </div>
                            <div
                                v-for="li in props.row.items?.filter(i => i.estado_item === 'Aprobado')"
                                :key="li._id"
                                class="q-mb-xs"
                            >
                                <!-- CONSUMIBLE -->
                                <template v-if="li.item?.tipo_categoria === 'Consumible'">
                                    <q-btn
                                        v-if="!li.notificacion_devolucion_enviada"
                                        icon="assignment_return"
                                        label="Notificar entrega/uso"
                                        color="orange-8" size="sm" flat dense
                                        @click="openReturnDialog(props.row, li)"
                                    >
                                        <q-tooltip>Notificar entrega o uso de: {{ li.item?.nombre }}</q-tooltip>
                                    </q-btn>
                                    <q-chip v-else dense color="orange-2" text-color="orange-9" icon="hourglass_top" size="sm">
                                        Pend. confirmación
                                        <q-tooltip>Ya notificaste la entrega de {{ li.item?.nombre }}. El admin debe confirmarla.</q-tooltip>
                                    </q-chip>
                                </template>

                                <!-- NO CONSUMIBLE -->
                                <template v-else>
                                    <!-- Hay notificación sin confirmar → bloquear -->
                                    <div v-if="tieneNotificacionPendiente(li)">
                                        <q-chip dense color="teal-1" text-color="teal-9" icon="hourglass_top" size="sm">
                                            Pend. confirmación
                                            <q-tooltip>Ya notificaste una devolución de {{ li.item?.nombre }}. El admin debe confirmarla antes de que puedas volver a notificar.</q-tooltip>
                                        </q-chip>
                                        <div class="text-caption text-grey-6" style="font-size:10px; margin-top:2px;">
                                            {{ li.cantidad_devuelta || 0 }} notif. · {{ li.cantidad_confirmada || 0 }} conf.
                                        </div>
                                    </div>
                                    <!-- Puede notificar más unidades -->
                                    <div v-else-if="getLiPendiente(li) > 0">
                                        <q-btn
                                            icon="assignment_return"
                                            :label="`DEVOLVER (${getLiPendiente(li)} pend.)`"
                                            color="primary" size="sm" flat dense
                                            @click="openReturnDialog(props.row, li)"
                                        >
                                            <q-tooltip>{{ li.item?.nombre }} — Confirmado: {{ li.cantidad_confirmada || 0 }} / {{ li.cantidad_aprobada ?? li.cantidad_prestamo }}</q-tooltip>
                                        </q-btn>
                                        <div v-if="(li.cantidad_confirmada || 0) > 0" class="text-caption text-positive" style="font-size:10.5px; margin-top:2px;">
                                            ✓ {{ li.cantidad_confirmada }} confirmado(s) por admin
                                        </div>
                                    </div>
                                    <!-- Todo confirmado (edge case: admin confirmó pero no cerró) -->
                                    <q-chip v-else dense color="green-1" text-color="green-9" icon="check_circle" size="sm">
                                        Completamente devuelto
                                        <q-tooltip>{{ li.item?.nombre }}: todas las unidades confirmadas.</q-tooltip>
                                    </q-chip>
                                </template>
                            </div>

                            <!-- Sin items activos pero préstamo aún abierto -->
                            <div v-if="!props.row.items?.some(i => i.estado_item === 'Aprobado')">
                                <q-chip dense color="grey-2" text-color="grey-7" icon="hourglass_top" size="sm">
                                    Esperando cierre
                                    <q-tooltip>Todos los ítems fueron notificados. Esperando confirmación final del administrador.</q-tooltip>
                                </q-chip>
                            </div>
                        </div>

                        <!-- Devuelto -->
                        <div v-else-if="props.row.estado === 'Devuelto'" class="text-center">
                            <q-icon name="check_circle" color="positive" size="sm" class="q-mr-xs">
                                <q-tooltip>Préstamo completado el {{ formatDate(props.row.fecha_retorno) }}</q-tooltip>
                            </q-icon>
                            <q-btn
                                icon="picture_as_pdf"
                                color="negative" size="sm" flat dense round
                                @click="generarPdfSalida(props.row)"
                            >
                                <q-tooltip>Descargar autorización de salida</q-tooltip>
                            </q-btn>
                        </div>

                        <!-- Rechazado -->
                        <div v-else-if="props.row.estado === 'Rechazado'" class="text-center">
                            <q-icon name="cancel" color="negative" size="sm">
                                <q-tooltip>{{ props.row.observacion_rechazo || 'Solicitud rechazada' }}</q-tooltip>
                            </q-icon>
                        </div>
                    </q-td>
                </template>
            </q-table>
        </div>

        <!-- ═══ Dialog de notificación de devolución (por sub-item) ═══ -->
        <q-dialog v-model="returnDialog" persistent>
            <q-card style="min-width: 400px; max-width: 520px; width: 100%">
                <q-toolbar :class="selectedLoanItem?.item?.tipo_categoria === 'Consumible' ? 'bg-orange-8' : 'bg-primary'" class="text-white">
                    <q-icon :name="selectedLoanItem?.item?.tipo_categoria === 'Consumible' ? 'recycling' : 'assignment_return'" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">
                        {{ selectedLoanItem?.item?.tipo_categoria === 'Consumible' ? 'Notificar Uso/Entrega' : 'Notificar Devolución' }}
                    </q-toolbar-title>
                    <q-btn icon="close" flat round dense v-close-popup :disable="returning" />
                </q-toolbar>

                <q-card-section v-if="selectedLoanItem" class="q-pt-md">
                    <!-- Info del ítem -->
                    <div class="item-info-box q-mb-md">
                        <div class="text-subtitle2 text-grey-7 q-mb-xs">
                            {{ selectedLoanItem.item?.tipo_categoria === 'Consumible' ? 'Ítem a entregar/reportar' : 'Ítem a devolver' }}
                        </div>
                        <div class="text-weight-bold text-grey-9">{{ selectedLoanItem.item?.nombre }}</div>
                        <div class="text-caption text-grey-6">{{ selectedLoanItem.aula?.nombre }}</div>
                        <span class="tipo-badge q-mt-xs" :class="`tipo-badge--${selectedLoanItem.item?.tipo_categoria === 'Consumible' ? 'orange' : 'blue'}`">
                            {{ selectedLoanItem.item?.tipo_categoria }}
                        </span>
                    </div>

                    <!-- Banner re-notificación (no recibida por admin) -->
                    <q-banner v-if="(selectedLoanItem.devolucion_pendiente_usuario || 0) > 0" rounded class="bg-red-1 text-red-9 q-mb-md" dense>
                        <template v-slot:avatar><q-icon name="warning" color="red"/></template>
                        El administrador <strong>no registró recepción</strong> de tu notificación anterior.
                        Vuelve a notificar <strong>{{ selectedLoanItem.devolucion_pendiente_usuario }}</strong> unidad(es).
                    </q-banner>

                    <!-- Banner consumible -->
                    <q-banner v-else-if="selectedLoanItem.item?.tipo_categoria === 'Consumible'" rounded class="bg-orange-1 text-orange-9 q-mb-md" dense>
                        <template v-slot:avatar><q-icon name="info" color="orange" /></template>
                        Ítem consumible. Indica cuántas unidades <strong>entregas físicamente</strong>. Si los usaste todos y no queda nada, indica <strong>0</strong>.
                    </q-banner>

                    <!-- No consumible: progreso + historial -->
                    <template v-else>
                        <q-banner rounded class="bg-blue-1 text-blue-9 q-mb-sm" dense>
                            <template v-slot:avatar><q-icon name="info" color="blue" /></template>
                            Puedes notificar devoluciones <strong>parciales</strong>. El préstamo se cerrará cuando devuelvas todas las unidades y el admin lo confirme.
                        </q-banner>
                        <div class="q-mb-md">
                            <div class="row items-center justify-between q-mb-xs">
                                <span class="text-caption text-grey-7">Progreso de devolución</span>
                                <span class="text-caption text-weight-bold" :class="getLiPendiente(selectedLoanItem) === 0 ? 'text-positive' : 'text-primary'">
                                    {{ selectedLoanItem.cantidad_devuelta || 0 }} / {{ selectedLoanItem.cantidad_aprobada ?? selectedLoanItem.cantidad_prestamo }} notificado(s)
                                </span>
                            </div>
                            <q-linear-progress
                                :value="(selectedLoanItem.cantidad_devuelta || 0) / (selectedLoanItem.cantidad_aprobada ?? selectedLoanItem.cantidad_prestamo)"
                                color="primary" size="8px" rounded
                            />
                            <div class="text-caption text-grey-6 q-mt-xs">
                                Quedan <strong>{{ getLiPendiente(selectedLoanItem) }}</strong> unidad(es) por notificar
                            </div>
                        </div>
                        <!-- Historial parciales -->
                        <div v-if="selectedLoanItem.devoluciones_parciales?.length > 0" class="q-mb-md">
                            <div class="text-caption text-grey-7 q-mb-xs">Notificaciones anteriores</div>
                            <div v-for="(d, i) in selectedLoanItem.devoluciones_parciales" :key="i" class="row items-start q-py-xs" style="border-bottom: 1px solid #f0f0f0;">
                                <q-icon
                                    :name="d.confirmado ? 'check_circle' : d.no_recibida ? 'cancel' : 'radio_button_unchecked'"
                                    :color="d.confirmado ? 'positive' : d.no_recibida ? 'negative' : 'grey-4'"
                                    size="16px" class="q-mr-sm q-mt-xs"/>
                                <div class="col">
                                    <div class="text-caption">
                                        <strong>{{ d.cantidad }}</strong> unidad(es)
                                        <q-badge v-if="d.confirmado" color="positive" label="Confirmado" class="q-ml-xs" style="font-size:9px"/>
                                        <q-badge v-else-if="d.no_recibida" color="negative" label="No recibida" class="q-ml-xs" style="font-size:9px"/>
                                        <q-badge v-else color="orange" label="Pendiente" class="q-ml-xs" style="font-size:9px"/>
                                    </div>
                                    <div v-if="d.no_recibida" class="text-caption text-negative" style="font-size:10px;">
                                        El administrador no registró recepción. Vuelve a notificar cuando entregues el ítem.
                                    </div>
                                    <div v-if="d.observacion" class="text-caption text-grey-6">{{ d.observacion }}</div>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- Campo cantidad -->
                    <div class="q-mb-sm">
                        <div class="text-subtitle2 text-grey-7 q-mb-xs">
                            {{ selectedLoanItem.item?.tipo_categoria === 'Consumible'
                                ? 'Unidades a entregar (0 = consumidas en su totalidad)'
                                : 'Cantidad a devolver ahora' }}
                        </div>
                        <q-input
                            v-model.number="returnForm.cantidadDevuelta"
                            type="number" outlined dense
                            :min="selectedLoanItem.item?.tipo_categoria === 'Consumible' ? 0 : 1"
                            :max="selectedLoanItem.item?.tipo_categoria === 'Consumible' ? (selectedLoanItem.cantidad_aprobada ?? selectedLoanItem.cantidad_prestamo) : getLiPendiente(selectedLoanItem)"
                            @keydown="['.', ',', 'e', 'E', '+', '-'].includes($event.key) && $event.preventDefault()"
                            :rules="[
                                val => (val !== null && val !== '') || 'Ingresa una cantidad',
                                val => Number.isInteger(Number(val)) || 'Solo números enteros',
                                val => selectedLoanItem.item?.tipo_categoria === 'Consumible' ? val >= 0 : val >= 1 || 'Mínimo 1 unidad',
                                val => val <= (selectedLoanItem.item?.tipo_categoria === 'Consumible' ? (selectedLoanItem.cantidad_aprobada ?? selectedLoanItem.cantidad_prestamo) : getLiPendiente(selectedLoanItem)) || 'Superas el máximo'
                            ]"
                        />
                    </div>

                    <!-- Observación -->
                    <div class="q-mb-sm">
                        <div class="text-subtitle2 text-grey-7 q-mb-xs">Observación <span class="text-grey-5 text-caption">(opcional)</span></div>
                        <q-input v-model="returnForm.observacion" type="textarea" outlined dense rows="2" maxlength="300" counter
                            :placeholder="selectedLoanItem.item?.tipo_categoria === 'Consumible' ? 'Ej: Solo quedan 2 unidades sin usar.' : 'Ej: Devuelvo 2 de 5, los otros los tengo aún.'"/>
                    </div>

                    <!-- Banners de confirmación -->
                    <q-banner v-if="selectedLoanItem.item?.tipo_categoria === 'Consumible' && Number(returnForm.cantidadDevuelta) === 0" rounded class="bg-orange-1 text-orange-9 q-mt-md" dense>
                        <template v-slot:avatar><q-icon name="recycling" color="orange-8" /></template>
                        Todos los consumibles fueron <strong>utilizados</strong>. El préstamo se cerrará automáticamente.
                    </q-banner>
                    <q-banner v-else-if="selectedLoanItem.item?.tipo_categoria === 'Consumible' && Number(returnForm.cantidadDevuelta) > 0" rounded class="bg-teal-1 text-teal-9 q-mt-md" dense>
                        <template v-slot:avatar><q-icon name="check_circle" color="teal" /></template>
                        Se notificará la entrega de <strong>{{ returnForm.cantidadDevuelta }} unidad(es)</strong>. El admin confirmará la recepción.
                    </q-banner>
                    <q-banner v-else-if="selectedLoanItem.item?.tipo_categoria !== 'Consumible' && returnForm.cantidadDevuelta > 0 && returnForm.cantidadDevuelta < getLiPendiente(selectedLoanItem)" rounded class="bg-amber-1 text-amber-9 q-mt-md" dense>
                        <template v-slot:avatar><q-icon name="info" color="amber-8"/></template>
                        Devolución <strong>parcial</strong>. Podrás notificar el resto después.
                    </q-banner>
                    <q-banner v-else-if="selectedLoanItem.item?.tipo_categoria !== 'Consumible' && Number(returnForm.cantidadDevuelta) === getLiPendiente(selectedLoanItem) && getLiPendiente(selectedLoanItem) > 0" rounded class="bg-teal-1 text-teal-9 q-mt-md" dense>
                        <template v-slot:avatar><q-icon name="check_circle" color="teal"/></template>
                        ¡Devolución <strong>completa</strong>! El admin recibirá la confirmación final.
                    </q-banner>
                </q-card-section>

                <q-card-actions align="right" class="q-px-md q-pb-md">
                    <q-btn flat label="Cancelar" color="grey" v-close-popup :disable="returning" />
                    <q-btn
                        unelevated :label="submitLabel"
                        :color="selectedLoanItem?.item?.tipo_categoria === 'Consumible' && Number(returnForm.cantidadDevuelta) === 0 ? 'green' : 'primary'"
                        :icon="selectedLoanItem?.item?.tipo_categoria === 'Consumible' && Number(returnForm.cantidadDevuelta) === 0 ? 'check' : 'send'"
                        :loading="returning"
                        :disable="hasReturnFormError || returning"
                        @click="submitReturn"
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>

    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { loansService } from '../../services/items.js';
import { generarPdfSalida } from '../../services/loanPdfService.js';

const $q = useQuasar();
const router = useRouter();

const loans = ref([]);
const loading = ref(false);
const error = ref(null);
const searchFilter = ref('');
const estadoFiltro = ref(null);

// ✅ CAMBIO: selectedLoanItem guarda el sub-item específico (li), no el préstamo
const returnDialog = ref(false);
const selectedLoan = ref(null);       // préstamo completo
const selectedLoanItem = ref(null);   // sub-item de items[]
const returning = ref(false);
const returnForm = ref({ cantidadDevuelta: null, observacion: '' });

const columns = [
    { name: 'item', required: true, label: 'Equipo', align: 'left', field: row => row.items?.map(i => i.item?.nombre).join(', '), sortable: true, style: 'min-width: 180px' },
    { name: 'cantidad', align: 'center', label: 'Cant.', field: 'cantidad', sortable: false, style: 'width: 80px' },
    { name: 'fecha_solicitud', align: 'center', label: 'F. Solicitud', field: 'fecha_solicitud', sortable: true, style: 'min-width: 130px' },
    { name: 'fecha_estimada', align: 'center', label: 'F. Devolución', field: 'fecha_estimada', sortable: true, style: 'min-width: 130px' },
    { name: 'status', label: 'Estado', field: 'estado', align: 'center', sortable: true, style: 'width: 110px' },
    { name: 'actions', label: 'Acciones', field: 'actions', align: 'center', style: 'min-width: 200px' }
];

const filterTabs = computed(() => [
    { label: 'Todos', value: null, icon: 'list', count: 0 },
    { label: 'Pendientes', value: 'Pendiente', icon: 'pending', count: countByStatus('Pendiente') },
    { label: 'Aprobados', value: 'Aprobado', icon: 'check_circle', count: countByStatus('Aprobado') },
    { label: 'Vencidos', value: 'Vencido', icon: 'alarm_off', count: overdueCount.value },
    { label: 'Aplazados', value: 'Aplazado', icon: 'event_repeat', count: countByStatus('Aplazado') },
    { label: 'Rechazados', value: 'Rechazado', icon: 'cancel', count: countByStatus('Rechazado') },
    { label: 'Devueltos', value: 'Devuelto', icon: 'assignment_turned_in', count: countByStatus('Devuelto') },
]);

const filteredLoans = computed(() => {
    if (!estadoFiltro.value) return loans.value;
    if (estadoFiltro.value === 'Vencido') return loans.value.filter(l => isOverdue(l));
    return loans.value.filter(loan => loan.estado === estadoFiltro.value);
});

const overdueCount = computed(() => loans.value.filter(l => isOverdue(l)).length);

// ── Helpers de sub-item ────────────────────────────────────────────────────────

// ✅ CORRECCIÓN: opera sobre el sub-item (li), no sobre el préstamo
const getLiPendiente = (li) => {
    if (!li) return 0;
    const total = li.cantidad_aprobada ?? li.cantidad_prestamo;
    const confirmada = li.cantidad_confirmada || 0;
    return Math.max(0, total - confirmada);
};

// ✅ CORRECCIÓN: opera sobre el sub-item (li)
const tieneNotificacionPendiente = (li) => {
    if (!li || li.item?.tipo_categoria === 'Consumible') return false;
    return (li.cantidad_devuelta || 0) > (li.cantidad_confirmada || 0);
};

// ── Dialog ────────────────────────────────────────────────────────────────────

// ✅ CORRECCIÓN: recibe (loan, li) — el préstamo Y el sub-item específico
const openReturnDialog = (loan, li) => {
    selectedLoan.value = loan;
    selectedLoanItem.value = li;
    const esConsumible = li.item?.tipo_categoria === 'Consumible';
    const total = li.cantidad_aprobada ?? li.cantidad_prestamo;
    returnForm.value = {
        cantidadDevuelta: esConsumible ? total : getLiPendiente(li),
        observacion: ''
    };
    returnDialog.value = true;
};

const submitLabel = computed(() => {
    if (!selectedLoanItem.value) return 'Enviar';
    const esConsumible = selectedLoanItem.value.item?.tipo_categoria === 'Consumible';
    if (esConsumible) {
        return Number(returnForm.value.cantidadDevuelta) === 0
            ? 'Confirmar uso total'
            : 'Notificar entrega parcial';
    }
    const cant = Number(returnForm.value.cantidadDevuelta);
    return cant === getLiPendiente(selectedLoanItem.value)
        ? 'Notificar devolución total'
        : 'Notificar devolución parcial';
});

const hasReturnFormError = computed(() => {
    if (!selectedLoanItem.value) return true;
    const v = returnForm.value.cantidadDevuelta;
    if (v === null || v === undefined || v === '') return true;
    const n = Number(v);
    if (isNaN(n) || !Number.isInteger(n)) return true;
    const esConsumible = selectedLoanItem.value.item?.tipo_categoria === 'Consumible';
    const maxVal = esConsumible
        ? (selectedLoanItem.value.cantidad_aprobada ?? selectedLoanItem.value.cantidad_prestamo)
        : getLiPendiente(selectedLoanItem.value);
    const minVal = esConsumible ? 0 : 1;
    if (n < minVal || n > maxVal) return true;
    return false;
});

const submitReturn = async () => {
    if (hasReturnFormError.value) return;
    if (!selectedLoan.value || !selectedLoanItem.value) return;

    returning.value = true;
    try {
        // ✅ CORRECCIÓN CLAVE: se envía loanItemId correctamente
        const result = await loansService.notifyReturn(selectedLoan.value._id, {
            loanItemId: selectedLoanItem.value._id,
            cantidadDevuelta: Number(returnForm.value.cantidadDevuelta),
            observacion: returnForm.value.observacion || undefined
        });

        returnDialog.value = false;
        $q.notify({
            type: 'positive',
            message: !result.notified ? '✅ Registrado. El ítem consumible fue utilizado en su totalidad.' : result.message,
            position: 'top', timeout: 5000
        });
        await loadLoans();
    } catch (err) {
        $q.notify({
            type: 'negative',
            message: err?.response?.data?.message || 'Error al enviar la notificación',
            position: 'top', icon: 'error', timeout: 3000
        });
    } finally {
        returning.value = false;
    }
};

const loadLoans = async () => {
    loading.value = true;
    error.value = null;
    try {
        const data = await loansService.getAll();
        loans.value = data;
    } catch (err) {
        error.value = 'Error al cargar los préstamos. Por favor, intenta nuevamente.';
        $q.notify({ type: 'negative', message: 'No se pudieron cargar los préstamos', position: 'top', icon: 'error', timeout: 3000 });
    } finally {
        loading.value = false;
    }
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const getLoanDisplayEstado = (loan) => {
    if (loan.estado !== 'Devuelto') {
        return { label: loan.estado, css: loan.estado.toLowerCase() };
    }
    const items = (loan.items || []).filter(li => !['Eliminado', 'Rechazado', 'Pendiente'].includes(li.estado_item));
    if (!items.length) return { label: 'Devuelto', css: 'devuelto' };
    const todosUsados    = items.every(li => li.estado_item === 'Usado' || li.item?.tipo_categoria === 'Consumible');
    const algunoUsado    = items.some(li => li.estado_item === 'Usado');
    const algunoDevuelto = items.some(li => li.estado_item === 'Devuelto');
    if (todosUsados)                   return { label: 'Consumido',      css: 'consumido' };
    if (algunoUsado && algunoDevuelto) return { label: 'Dev./Consumido', css: 'mixto' };
    return { label: 'Devuelto', css: 'devuelto' };
};

const isOverdue = (loan) => {
    if (!loan.fecha_estimada || loan.estado === 'Devuelto' || loan.estado === 'Rechazado') return false;
    return new Date(loan.fecha_estimada) < new Date();
};

const getRowClass = (row) => isOverdue(row) ? 'loan-expired' : '';
const countByStatus = (status) => loans.value.filter(loan => loan.estado === status).length;

onMounted(() => {
    loadLoans();
    setInterval(loadLoans, 30000);
});
</script>

<style scoped>
/* (mantener todos los estilos del original — stat-chip, filter-bar, tipo-badge, status-badge, etc.) */

:root { --c-border: #e2e8f0; --radius-md: 10px; --radius-lg: 12px; }
.page-bg { background: #f0f4f8; min-height: 100vh; }
.header-icon-wrap { width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #1565c0, #1e88e5); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(21,101,192,.3); }
.lh-tight { line-height: 1.2; }
.action-btn { border-radius: 8px !important; font-size: 13px; }
.stat-chip { border-radius: var(--radius-md); padding: 12px 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; border: 2px solid transparent; transition: all .18s ease; user-select: none; min-height: 58px; }
.stat-chip:hover { transform: translateY(-1px); }
.stat-chip--green { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
.stat-chip--grey  { background: #f8fafc; color: #475569; border-color: #e2e8f0; }
.stat-chip--red   { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
.stat-chip--blue  { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
.stat-chip--green.stat-chip--active { background: #dcfce7; box-shadow: 0 0 0 3px rgba(22,163,74,.2); border-color: #16a34a; }
.stat-chip--grey.stat-chip--active  { background: #e2e8f0; box-shadow: 0 0 0 3px rgba(71,85,105,.2); border-color: #475569; }
.stat-chip--red.stat-chip--active   { background: #fee2e2; box-shadow: 0 0 0 3px rgba(220,38,38,.2); border-color: #dc2626; }
.stat-chip--blue.stat-chip--active  { background: #dbeafe; box-shadow: 0 0 0 3px rgba(37,99,235,.2); border-color: #2563eb; }
.stat-number { font-size: 20px; font-weight: 700; line-height: 1; }
.stat-label  { font-size: 11px; font-weight: 500; opacity: .8; }
.filter-bar { background: white; border-radius: var(--radius-md); border: 1px solid var(--c-border); overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.filter-bar__inner { display: flex; overflow-x: auto; scrollbar-width: none; }
.filter-bar__inner::-webkit-scrollbar { display: none; }
.filter-tab { flex-shrink: 0; display: flex; align-items: center; gap: 4px; padding: 10px 16px; border: none; background: transparent; color: #64748b; font-size: 13px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; transition: all .15s ease; white-space: nowrap; }
.filter-tab:hover { background: #f8fafc; color: #1e293b; }
.filter-tab--active { color: #1565c0; border-bottom-color: #1565c0; background: #f0f5ff; font-weight: 600; }
.filter-tab__badge { background: #dc2626; color: white; border-radius: 10px; font-size: 10px; padding: 1px 6px; font-weight: 700; margin-left: 2px; }
.table-card { background: white; border-radius: var(--radius-lg); border: 1px solid var(--c-border); box-shadow: 0 1px 6px rgba(0,0,0,.06); overflow: hidden; }
.search-input { min-width: 180px; max-width: 260px; background: #f8fafc; border-radius: 8px; padding: 2px 10px; }
.data-table :deep(thead tr th) { background: #f8fafc; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #64748b; }
.data-table :deep(tbody tr td) { padding: 10px 12px !important; vertical-align: top; }
.cell-primary { font-size: 13px; color: #1e293b; }
.cell-secondary { font-size: 11px; color: #94a3b8; margin-top: 1px; }
.overdue-pill { display: inline-flex; align-items: center; background: #dc2626; color: white; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: 700; margin-top: 3px; letter-spacing: .3px; }
.loan-expired { background: #fff5f5 !important; }
.loan-expired :deep(td) { border-bottom-color: #fecaca !important; }
.tipo-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; margin-top: 3px; }
.tipo-badge--orange { background: #fff7ed; color: #c2410c; }
.tipo-badge--blue   { background: #eff6ff; color: #1d4ed8; }
.tipo-badge--purple { background: #f5f3ff; color: #7c3aed; }
.status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: .3px; text-transform: uppercase; }
.status-badge--aprobado  { background:#dcfce7; color:#15803d; }
.status-badge--aplazado  { background:#fff7ed; color:#c2410c; }
.status-badge--devuelto  { background:#dbeafe; color:#1d4ed8; }
.status-badge--rechazado { background:#fee2e2; color:#b91c1c; }
.status-badge--pendiente { background:#f1f5f9; color:#475569; }
.status-badge--vencido   { background:#fee2e2; color:#b91c1c; }
.status-badge--consumido { background:#fff3e0; color:#e65100; }
.status-badge--mixto     { background:#ede7f6; color:#6a1b9a; }
.item-info-box { background: #f8fafc; border-radius: 8px; padding: 12px 14px; border: 1px solid #e2e8f0; }
@media (max-width: 599px) { .page-bg { padding: 10px 8px !important; } .stat-chip { padding: 10px 10px; gap: 6px; min-height: 52px; } .stat-number { font-size: 17px; } .filter-tab { padding: 9px 12px; font-size: 12px; } .search-input { min-width: 140px; max-width: 100%; } }
@media (max-width: 400px) { .stat-label { display: none; } }
</style>