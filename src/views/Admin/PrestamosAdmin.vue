<template>
    <q-page class="page-bg q-pa-md q-pa-sm-xs">

        <!-- ── Header ────────────────────────────────────────────── -->
        <div class="page-header row items-center q-mb-md q-gutter-sm">
            <div class="row items-center col-12 col-sm-auto">
                <div class="header-icon-wrap q-mr-sm">
                    <q-icon name="swap_horiz" size="22px" color="white"/>
                </div>
                <div>
                    <div class="text-h6 text-weight-bold text-dark lh-tight">Gestión de Préstamos</div>
                    <div class="text-caption text-grey-6">Activos, movimientos y vencidos</div>
                </div>
            </div>
            <q-space class="gt-xs"/>
            <div class="row q-gutter-xs">
                <q-btn color="positive" icon="download" label="Excel" unelevated dense no-caps
                    @click="exportToExcel" :disable="filteredLoans.length === 0" class="action-btn">
                    <q-tooltip>Descargar préstamos en Excel</q-tooltip>
                </q-btn>
                <q-btn outline color="primary" icon="refresh" label="Actualizar" dense no-caps
                    @click="loadLoans" :loading="loading" class="action-btn"/>
            </div>
        </div>

        <!-- ── Stat chips ─────────────────────────────────────────── -->
        <div v-if="loans.length > 0" class="row q-col-gutter-sm q-mb-md">
            <div class="col-6 col-sm-3">
                <div class="stat-chip stat-chip--green"
                    :class="{ 'stat-chip--active': estadoFiltro === 'Aprobado' }"
                    @click="estadoFiltro = estadoFiltro === 'Aprobado' ? null : 'Aprobado'">
                    <q-icon name="check_circle" size="18px"/>
                    <div class="stat-number">{{ countByStatus('Aprobado') }}</div>
                    <div class="stat-label">Aprobados</div>
                </div>
            </div>
            <div class="col-6 col-sm-3">
                <div class="stat-chip stat-chip--orange"
                    :class="{ 'stat-chip--active': estadoFiltro === 'Aplazado' }"
                    @click="estadoFiltro = estadoFiltro === 'Aplazado' ? null : 'Aplazado'">
                    <q-icon name="event_repeat" size="18px"/>
                    <div class="stat-number">{{ countByStatus('Aplazado') }}</div>
                    <div class="stat-label">Aplazados</div>
                </div>
            </div>
            <div class="col-6 col-sm-3">
                <div class="stat-chip stat-chip--red"
                    :class="{ 'stat-chip--active': estadoFiltro === 'Vencido' }"
                    @click="estadoFiltro = estadoFiltro === 'Vencido' ? null : 'Vencido'">
                    <q-icon name="alarm_off" size="18px"/>
                    <div class="stat-number">{{ overdueCount }}</div>
                    <div class="stat-label">Vencidos</div>
                </div>
            </div>
            <div class="col-6 col-sm-3">
                <div class="stat-chip stat-chip--blue"
                    :class="{ 'stat-chip--active': estadoFiltro === 'Devuelto' }"
                    @click="estadoFiltro = estadoFiltro === 'Devuelto' ? null : 'Devuelto'">
                    <q-icon name="assignment_turned_in" size="18px"/>
                    <div class="stat-number">{{ countByStatus('Devuelto') }}</div>
                    <div class="stat-label">Devueltos</div>
                </div>
            </div>
        </div>

        <!-- ── Filter tabs ────────────────────────────────────────── -->
        <div class="row q-mb-md q-gutter-xs">
            <div v-for="opt in filterOptions" :key="opt.value ?? 'all'"
                class="filter-tab" :class="{ 'filter-tab--active': estadoFiltro === opt.value }"
                @click="estadoFiltro = opt.value">
                <q-icon :name="opt.icon" size="14px" class="q-mr-xs"/>{{ opt.label }}
            </div>
        </div>

        <!-- ── Error ──────────────────────────────────────────────── -->
        <div v-if="error" class="column items-center q-py-xl">
            <q-icon name="error_outline" size="56px" color="negative" class="q-mb-md"/>
            <div class="text-body1 text-negative">{{ error }}</div>
            <q-btn color="primary" label="Reintentar" @click="loadLoans" class="q-mt-md" unelevated/>
        </div>

        <!-- ── Table ──────────────────────────────────────────────── -->
        <q-card v-else class="table-card" flat>
            <q-table
                :rows="filteredLoans"
                :columns="columns"
                row-key="_id"
                :filter="searchFilter"
                :loading="loading"
                :rows-per-page-options="[10, 25, 50, 0]"
                no-data-label="No hay préstamos para mostrar"
                :row-class="getRowClass"
                class="data-table" flat>

                <template v-slot:top>
                    <div class="row full-width items-center q-px-sm q-py-sm q-gutter-sm">
                        <div class="text-subtitle2 text-weight-bold text-dark col-auto">
                            Listado de Préstamos
                            <q-badge v-if="filteredLoans.length" color="primary" class="q-ml-xs" :label="filteredLoans.length"/>
                        </div>
                        <q-space/>
                        <q-input outlined dense debounce="300" v-model="searchFilter"
                            placeholder="Buscar..." class="search-input">
                            <template v-slot:prepend><q-icon name="search"/></template>
                            <template v-slot:append>
                                <q-icon v-if="searchFilter" name="close" class="cursor-pointer" @click="searchFilter = ''"/>
                            </template>
                        </q-input>
                    </div>
                </template>

                <template v-slot:body-cell-id="props">
                    <q-td :props="props">
                        <div class="text-weight-bold" style="font-size:12px;font-family:monospace;">
                            #{{ props.row._id.slice(-6).toUpperCase() }}
                        </div>
                        <div v-if="isOverdue(props.row)" class="overdue-pill">
                            <q-icon name="alarm_off" size="10px" class="q-mr-xs"/>VENCIDO
                        </div>
                    </q-td>
                </template>

                <!-- Columna Items: muestra todos los ítems del préstamo -->
                <template v-slot:body-cell-item="props">
                    <q-td :props="props">
                        <div v-for="(li, idx) in getApprovedItems(props.row)" :key="li._id"
                            :class="idx > 0 ? 'q-mt-xs' : ''">
                            <div class="row items-center no-wrap" style="gap:4px;">
                                <div class="text-weight-medium text-dark" style="font-size:13px;">
                                    {{ li.item?.nombre }}
                                </div>
                                <q-badge
                                    :color="li.item?.tipo_categoria === 'Consumible' ? 'orange-2' : 'blue-2'"
                                    :text-color="li.item?.tipo_categoria === 'Consumible' ? 'orange-9' : 'blue-9'"
                                    :label="li.item?.tipo_categoria" style="font-size:9px;"/>
                            </div>
                            <div class="text-caption text-grey-6">
                                📍 {{ li.aula?.nombre || '—' }} · {{ li.cantidad_prestamo }} ud.
                                <span v-if="(li.cantidad_confirmada || 0) > 0"
                                    class="text-teal-8 q-ml-xs">✓{{ li.cantidad_confirmada }}</span>
                            </div>
                        </div>
                        <!-- Ítems ya devueltos -->
                        <div v-if="getReturnedItems(props.row).length" class="q-mt-xs">
                            <div v-for="li in getReturnedItems(props.row)" :key="li._id"
                                class="text-caption text-grey-5" style="text-decoration:line-through;">
                                {{ li.item?.nombre }}
                            </div>
                        </div>
                    </q-td>
                </template>

                <template v-slot:body-cell-solicitante="props">
                    <q-td :props="props">
                        <div class="text-weight-medium text-dark">{{ props.row.usuario?.nombre || '—' }}</div>
                        <div class="text-caption text-grey-6">{{ props.row.usuario?.email || '—' }}</div>
                    </q-td>
                </template>

                <template v-slot:body-cell-fecha_prestamo="props">
                    <q-td :props="props" class="text-center">
                        <div class="text-caption">{{ formatDate(props.row.fecha_prestamo) }}</div>
                    </q-td>
                </template>

                <template v-slot:body-cell-fecha_estimada="props">
                    <q-td :props="props" class="text-center">
                        <div class="text-caption"
                            :class="isOverdue(props.row) ? 'text-negative text-weight-bold' : ''">
                            {{ formatDate(props.row.fecha_estimada) }}
                        </div>
                    </q-td>
                </template>

                <template v-slot:body-cell-status="props">
                    <q-td :props="props" class="text-center">
                        <span class="status-badge" :class="`status-badge--${getLoanDisplayEstado(props.row).css}`">
                            {{ getLoanDisplayEstado(props.row).label }}
                        </span>
                        <!-- Indicador de ítems pendientes de confirmación -->
                        <div v-if="totalPendingConfirmations(props.row) > 0" class="q-mt-xs">
                            <q-badge color="teal" :label="`${totalPendingConfirmations(props.row)} ud. por confirmar`" style="font-size:9px;"/>
                        </div>
                    </q-td>
                </template>

                <template v-slot:body-cell-actions="props">
                    <q-td :props="props">
                        <div class="row no-wrap items-center justify-center" style="gap:2px;">

                            <!-- Botón principal: gestionar devoluciones del préstamo completo -->
                            <q-btn
                                v-if="['Aprobado', 'Aplazado'].includes(props.row.estado)"
                                icon="assignment_return"
                                :color="totalPendingConfirmations(props.row) > 0 ? 'teal' : (canCloseLoan(props.row) ? 'positive' : 'grey-5')"
                                size="sm" round flat dense
                                @click="openReturnManager(props.row)">
                                <q-badge v-if="totalPendingConfirmations(props.row) > 0"
                                    color="orange" floating :label="totalPendingConfirmations(props.row)"/>
                                <q-tooltip>
                                    {{ totalPendingConfirmations(props.row) > 0
                                        ? `Gestionar devoluciones (${totalPendingConfirmations(props.row)} ud. pendientes)`
                                        : canCloseLoan(props.row) ? 'Cerrar préstamo' : 'Gestionar préstamo' }}
                                </q-tooltip>
                            </q-btn>

                            <!-- Descargar autorización de salida PDF (solo préstamos aprobados) -->
                            <q-btn
                                v-if="['Aprobado', 'Aplazado'].includes(props.row.estado)"
                                icon="picture_as_pdf"
                                color="negative"
                                size="sm" round flat dense
                                @click="descargarPDF(props.row)">
                                <q-tooltip>Descargar autorización de salida (PDF)</q-tooltip>
                            </q-btn>

                            <q-btn v-if="canDelay(props.row)" icon="event_repeat" color="orange-8"
                                size="sm" round flat dense @click="openDelayDialog(props.row)">
                                <q-tooltip>Extender fecha</q-tooltip>
                            </q-btn>
                            <q-btn icon="remove_red_eye" color="blue-7" size="sm" round flat dense
                                @click="openDetailDialog(props.row)">
                                <q-tooltip>Ver detalles</q-tooltip>
                            </q-btn>
                            <q-btn icon="delete" color="negative" size="sm" round flat dense
                                @click="confirmDelete(props.row)">
                                <q-tooltip>Eliminar</q-tooltip>
                            </q-btn>
                        </div>
                    </q-td>
                </template>
            </q-table>
        </q-card>

        <!-- ═══════════════════════════════════════════════════════════════════
             DIÁLOGO PRINCIPAL: Gestor de Devoluciones del Préstamo Completo
        ════════════════════════════════════════════════════════════════════ -->
        <q-dialog v-model="returnManagerDialog" persistent maximized transition-show="slide-up" transition-hide="slide-down">
            <q-card class="return-manager-card">

                <!-- Toolbar -->
                <q-toolbar class="bg-teal text-white" style="min-height:56px;">
                    <q-icon name="assignment_return" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title>
                        <div class="text-weight-bold">Gestión de Devoluciones</div>
                        <div class="text-caption" style="opacity:.8;" v-if="managedLoan">
                            {{ managedLoan.usuario?.nombre }} · #{{ managedLoan._id.slice(-6).toUpperCase() }}
                        </div>
                    </q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup @click="closeReturnManager"/>
                </q-toolbar>

                <q-card-section v-if="managedLoan" class="q-pa-md" style="overflow-y:auto;max-height:calc(100vh - 56px);">

                    <!-- Info general del préstamo -->
                    <div class="row q-col-gutter-sm q-mb-md">
                        <div class="col-12 col-sm-4">
                            <div class="info-pill">
                                <q-icon name="person" size="16px" color="teal" class="q-mr-xs"/>
                                <span class="text-weight-medium">{{ managedLoan.usuario?.nombre }}</span>
                            </div>
                        </div>
                        <div class="col-12 col-sm-4">
                            <div class="info-pill">
                                <q-icon name="event" size="16px" color="teal" class="q-mr-xs"/>
                                <span>Dev. estimada: <strong>{{ formatDate(managedLoan.fecha_estimada) }}</strong></span>
                            </div>
                        </div>
                        <div class="col-12 col-sm-4">
                            <div class="info-pill">
                                <q-icon name="inventory_2" size="16px" color="teal" class="q-mr-xs"/>
                                <span>{{ getApprovedItems(managedLoan).length }} ítem(s) activo(s)</span>
                            </div>
                        </div>
                    </div>

                    <!-- ── Tarjeta por cada ítem aprobado ── -->
                    <div v-for="li in getApprovedItems(managedLoan)" :key="li._id" class="item-return-card q-mb-md">

                        <!-- Cabecera del ítem -->
                        <div class="item-card-header row items-center q-pa-sm" style="gap:8px;">
                            <div class="item-type-dot"
                                :class="li.item?.tipo_categoria === 'Consumible' ? 'dot-orange' : 'dot-blue'"/>
                            <div class="col">
                                <div class="text-weight-bold text-dark">{{ li.item?.nombre }}</div>
                                <div class="text-caption text-grey-6">
                                    📍 {{ li.aula?.nombre || 'N/A' }} ·
                                    <span :class="li.item?.tipo_categoria === 'Consumible' ? 'text-orange-8' : 'text-blue-8'">
                                        {{ li.item?.tipo_categoria }}
                                    </span>
                                </div>
                            </div>
                            <!-- Badge de estado del item -->
                            <div>
                                <q-badge v-if="getItemReturnStatus(li) === 'completo'"
                                    :color="li.item?.tipo_categoria === 'Consumible' ? 'orange-8' : 'positive'"
                                    :label="li.item?.tipo_categoria === 'Consumible' ? '✓ Usado/Entregado' : '✓ Confirmado'"
                                    style="font-size:11px;padding:4px 8px;"/>
                                <q-badge v-else-if="getItemReturnStatus(li) === 'pendiente_usuario'"
                                    color="grey-5" label="Esperando usuario" style="font-size:11px;padding:4px 8px;"/>
                                <q-badge v-else-if="getItemReturnStatus(li) === 'pendiente_admin'"
                                    color="orange" label="⚠ Por confirmar" style="font-size:11px;padding:4px 8px;"/>
                                <q-badge v-else-if="getItemReturnStatus(li) === 'parcial'"
                                    color="teal" label="Parcialmente confirmado" style="font-size:11px;padding:4px 8px;"/>
                            </div>
                        </div>

                        <div class="q-pa-sm">

                            <!-- Barra de progreso -->
                            <div class="row items-center q-mb-xs" style="gap:8px;">
                                <span class="text-caption text-grey-6" style="min-width:90px;">Confirmadas</span>
                                <q-linear-progress
                                    :value="(li.cantidad_confirmada || 0) / (li.cantidad_prestamo || 1)"
                                    color="positive" size="8px" rounded class="col"/>
                                <span class="text-caption text-weight-bold text-positive" style="min-width:50px;text-align:right;">
                                    {{ li.cantidad_confirmada || 0 }}/{{ li.cantidad_prestamo }}
                                </span>
                            </div>
                            <div v-if="li.item?.tipo_categoria !== 'Consumible'" class="row items-center q-mb-sm" style="gap:8px;">
                                <span class="text-caption text-grey-6" style="min-width:90px;">Notificadas</span>
                                <q-linear-progress
                                    :value="(li.cantidad_devuelta || 0) / (li.cantidad_prestamo || 1)"
                                    color="orange" size="6px" rounded class="col"/>
                                <span class="text-caption text-weight-bold text-orange-8" style="min-width:50px;text-align:right;">
                                    {{ li.cantidad_devuelta || 0 }}/{{ li.cantidad_prestamo }}
                                </span>
                            </div>

                            <!-- Historial de devoluciones parciales -->
                            <div v-if="(li.devoluciones_parciales || []).length" class="q-mb-sm">
                                <div class="text-caption text-grey-5 q-mb-xs" style="text-transform:uppercase;letter-spacing:.4px;">
                                    Historial
                                </div>
                                <div v-for="d in li.devoluciones_parciales" :key="d._id || d.fecha"
                                    class="devolucion-row row items-start q-mb-xs" style="gap:6px;">
                                    <q-icon
                                        :name="d.confirmado ? 'check_circle' : d.no_recibida ? 'cancel' : 'pending'"
                                        :color="d.confirmado ? 'positive' : d.no_recibida ? 'negative' : 'orange'"
                                        size="16px" class="q-mt-xs"/>
                                    <div class="col">
                                        <span class="text-caption text-dark text-weight-medium">{{ d.cantidad }} ud.</span>
                                        <span class="text-caption text-grey-6 q-ml-xs">{{ formatDate(d.fecha) }}</span>
                                        <span v-if="d.confirmado" class="text-caption text-positive q-ml-xs">
                                            · ✓ {{ formatDate(d.fecha_confirmacion) }}
                                        </span>
                                        <span v-else-if="d.no_recibida" class="text-caption text-negative q-ml-xs">
                                            · ✗ no recibida — esperando nueva notificación
                                        </span>
                                        <span v-else class="text-caption text-orange-8 q-ml-xs">· pendiente</span>
                                        <div v-if="d.observacion" class="text-caption text-grey-5">💬 {{ d.observacion }}</div>
                                        <div v-if="d.observacion_recepcion" class="text-caption text-teal-7">📋 Admin: {{ d.observacion_recepcion }}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- ── PANEL DE CONFIRMACIÓN (si hay pendientes) ── -->
                            <div v-if="getItemPendingQty(li) > 0" class="confirm-inline-panel q-pa-sm q-mt-xs">
                                <div class="text-caption text-teal-9 text-weight-bold q-mb-sm">
                                    ⬇ Confirmar recepción física
                                    <span class="text-grey-6 text-weight-regular q-ml-xs">
                                        (notificadas sin confirmar: {{ getItemPendingQty(li) }} ud.)
                                    </span>
                                </div>
                                <div class="row items-start q-col-gutter-sm">
                                    <div class="col-12 col-sm-4">
                                        <q-input
                                            :model-value="itemConfirmInputs[li._id]?.qty"
                                            @update:model-value="v => setItemInput(li._id, 'qty', v)"
                                            type="number" step="1" outlined dense
                                            label="Unidades recibidas (0 = no recibidas)"
                                            :min="0"
                                            :max="getItemMaxConfirmable(li)"
                                            @keydown="e => ['.','e','E','+','-'].includes(e.key) && e.preventDefault()"
                                            bg-color="teal-1"
                                            color="teal"
                                            :rules="[
                                                v => (v !== null && v !== undefined && v !== '') || 'Ingresa una cantidad',
                                                v => Number.isInteger(Number(v)) || 'Solo números enteros',
                                                v => Number(v) >= 0 || 'Mínimo 0',
                                                v => Number(v) <= getItemMaxConfirmable(li) || `Máximo: ${getItemMaxConfirmable(li)} ud.`
                                            ]"
                                            hide-bottom-space>
                                            <template v-slot:append>
                                                <span class="text-caption text-grey-5">/{{ getItemMaxConfirmable(li) }}</span>
                                            </template>
                                        </q-input>
                                        <div v-if="Number(itemConfirmInputs[li._id]?.qty) === 0 && !hasItemQtyError(li)"
                                            class="text-caption text-orange-8 q-mt-xs row items-center">
                                            <q-icon name="info" size="12px" class="q-mr-xs"/>
                                            Se registrará como "devolución no recibida" y se notificará al usuario
                                        </div>
                                    </div>
                                    <div class="col-12 col-sm-5">
                                        <q-input
                                            :model-value="itemConfirmInputs[li._id]?.obs"
                                            @update:model-value="v => setItemInput(li._id, 'obs', v)"
                                            outlined dense
                                            label="Observación (opcional)"
                                            maxlength="300"
                                            bg-color="teal-1"
                                            color="teal"/>
                                    </div>
                                    <div class="col-12 col-sm-3 row items-center">
                                        <q-btn
                                            :label="Number(itemConfirmInputs[li._id]?.qty) === 0 ? 'Registrar no recibida' : Number(itemConfirmInputs[li._id]?.qty) >= getItemMaxConfirmable(li) ? 'Confirmar todo' : 'Confirmar'"
                                            :color="Number(itemConfirmInputs[li._id]?.qty) === 0 ? 'orange-8' : Number(itemConfirmInputs[li._id]?.qty) >= getItemMaxConfirmable(li) ? 'positive' : 'teal'"
                                            :icon="Number(itemConfirmInputs[li._id]?.qty) === 0 ? 'block' : 'check'"
                                            unelevated dense no-caps
                                            class="full-width"
                                            :loading="confirmingItem[li._id]"
                                            :disable="hasItemQtyError(li)"
                                            @click="confirmSingleItem(managedLoan, li)"/>
                                    </div>
                                </div>
                            </div>

                            <!-- Todo confirmado para este ítem -->
                            <div v-else-if="getItemReturnStatus(li) === 'completo'" class="all-confirmed-banner q-pa-xs q-mt-xs">
                                <q-icon name="check_circle" color="positive" size="16px" class="q-mr-xs"/>
                                <span class="text-caption text-positive text-weight-bold">
                                    Todas las unidades confirmadas · stock restaurado
                                </span>
                            </div>

                        </div>
                    </div>

                    <!-- ── Ítems ya devueltos ── -->
                    <div v-if="getReturnedItems(managedLoan).length" class="q-mb-md">
                        <div class="text-caption text-grey-5 q-mb-xs" style="text-transform:uppercase;letter-spacing:.4px;">
                            Ítems ya cerrados
                        </div>
                        <div v-for="li in getReturnedItems(managedLoan)" :key="li._id"
                            class="returned-item-row q-pa-sm q-mb-xs">
                            <q-icon name="check_circle" color="positive" size="16px" class="q-mr-sm"/>
                            <span class="text-caption text-grey-6" style="text-decoration:line-through;">{{ li.item?.nombre }}</span>
                            <q-badge
                                :color="li.item?.tipo_categoria === 'Consumible' ? 'orange-8' : 'positive'"
                                :label="li.item?.tipo_categoria === 'Consumible' ? 'Usado/Entregado' : 'Devuelto'"
                                class="q-ml-sm" style="font-size:9px;"/>
                        </div>
                    </div>

                    <!-- ── Acción de cierre completo del préstamo ── -->
                    <q-separator class="q-my-md"/>
                    <div class="row items-center justify-between">
                        <div>
                            <div class="text-subtitle2 text-weight-bold">Cierre del préstamo</div>
                            <div class="text-caption text-grey-6">
                                <template v-if="canCloseLoan(managedLoan)">
                                    Todos los ítems devolutivos están confirmados. Puedes cerrar el préstamo.
                                </template>
                                <template v-else>
                                    Aún hay ítems devolutivos pendientes de confirmación.
                                </template>
                            </div>
                            <div v-if="canCloseLoan(managedLoan) && getApprovedItems(managedLoan).some(li => li.item?.tipo_categoria === 'Consumible' && (li.cantidad_confirmada || 0) < li.cantidad_prestamo)"
                                class="text-caption text-orange-8 q-mt-xs">
                                <q-icon name="info" size="12px" class="q-mr-xs"/>
                                Hay consumibles con devolución parcial o sin confirmar. El cierre es definitivo.
                            </div>
                        </div>
                        <q-btn
                            label="Cerrar préstamo completo"
                            icon="lock"
                            :color="canCloseLoan(managedLoan) ? 'positive' : 'grey-4'"
                            :disable="!canCloseLoan(managedLoan)"
                            unelevated no-caps
                            :loading="closingLoan"
                            @click="executeFinalReturn(managedLoan)"/>
                    </div>

                </q-card-section>
            </q-card>
        </q-dialog>

        <!-- ── Dialog Aplazar ─────────────────────────────────────── -->
        <q-dialog v-model="delayDialog" persistent>
            <q-card style="width: 450px; max-width: 95%;">
                <q-toolbar class="bg-orange-8 text-white">
                    <q-icon name="event_repeat" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">Aplazar Préstamo</q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>
                <q-card-section>
                    <div class="text-subtitle1 q-mb-md">
                        <strong>Solicitante:</strong> {{ selectedLoan?.usuario?.nombre }}<br>
                        <strong>Fecha actual de devolución:</strong>
                        <span class="text-negative text-weight-bold"> {{ formatDate(selectedLoan?.fecha_estimada) }}</span>
                    </div>
                    <q-form @submit.prevent="submitDelay" class="q-gutter-md">
                        <q-input v-model="delayForm.nueva_fecha_estimada" filled
                            label="Nueva Fecha de Devolución" type="datetime-local"
                            color="orange-8" :min="minDelayDate"
                            :rules="[
                                val => !!val || 'Fecha requerida',
                                val => new Date(val) > new Date(selectedLoan?.fecha_estimada) || 'Debe ser posterior a la actual',
                                val => new Date(val) > new Date() || 'No puedes aplazar a una fecha pasada'
                            ]">
                            <template v-slot:prepend><q-icon name="event" color="orange-8"/></template>
                        </q-input>
                        <q-card-actions align="right" class="q-mt-lg q-pb-none">
                            <q-btn flat label="Cancelar" color="grey" v-close-popup/>
                            <q-btn label="Aplazar Préstamo" type="submit" color="orange-8" icon="check" :loading="submitting"/>
                        </q-card-actions>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>

        <!-- ── Dialog Detalle ─────────────────────────────────────── -->
        <q-dialog v-model="detailDialog">
            <q-card style="width: 540px; max-width: 95%;">
                <q-toolbar class="bg-blue-8 text-white">
                    <q-icon name="info" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">Detalle del Préstamo</q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup/>
                </q-toolbar>
                <q-card-section v-if="selectedLoan">
                    <q-list separator>
                        <q-item>
                            <q-item-section avatar><q-icon name="tag" color="primary"/></q-item-section>
                            <q-item-section>
                                <q-item-label caption>ID Préstamo</q-item-label>
                                <q-item-label class="text-weight-medium">{{ selectedLoan._id.slice(-8).toUpperCase() }}</q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section avatar><q-icon name="person" color="primary"/></q-item-section>
                            <q-item-section>
                                <q-item-label caption>Solicitante</q-item-label>
                                <q-item-label class="text-weight-medium">{{ selectedLoan.usuario?.nombre }}</q-item-label>
                                <q-item-label caption>{{ selectedLoan.usuario?.email }}</q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section avatar><q-icon name="inventory_2" color="primary"/></q-item-section>
                            <q-item-section>
                                <q-item-label caption>Ítems del préstamo</q-item-label>
                                <div v-for="li in selectedLoan.items" :key="li._id" class="q-mt-xs">
                                    <div class="row items-center" style="gap:6px;">
                                        <q-badge
                                            :color="li.estado_item === 'Aprobado' ? 'positive' : (li.estado_item === 'Devuelto' || li.estado_item === 'Usado') ? 'blue' : 'grey'"
                                            :label="li.estado_item" style="font-size:9px;"/>
                                        <span class="text-weight-medium">{{ li.item?.nombre }}</span>
                                        <span class="text-caption text-grey-6">· {{ li.cantidad_prestamo }} ud.</span>
                                    </div>
                                    <div class="text-caption text-grey-6 q-ml-xs">📍 {{ li.aula?.nombre }}</div>
                                </div>
                            </q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section avatar><q-icon name="event" color="primary"/></q-item-section>
                            <q-item-section>
                                <q-item-label caption>Fecha de Préstamo</q-item-label>
                                <q-item-label class="text-weight-medium">{{ formatDate(selectedLoan.fecha_prestamo) }}</q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section avatar><q-icon name="event_available" color="orange"/></q-item-section>
                            <q-item-section>
                                <q-item-label caption>Fecha Estimada de Devolución</q-item-label>
                                <q-item-label class="text-weight-medium"
                                    :class="isOverdue(selectedLoan) ? 'text-negative' : ''">
                                    {{ formatDate(selectedLoan.fecha_estimada) }}
                                    <q-badge v-if="isOverdue(selectedLoan)" color="negative" label="VENCIDO" class="q-ml-xs"/>
                                </q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section avatar><q-icon name="info" color="primary"/></q-item-section>
                            <q-item-section>
                                <q-item-label caption>Estado</q-item-label>
                                <q-badge :color="getStatusColor(selectedLoan.estado)" :label="selectedLoan.estado"/>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat label="Cerrar" color="primary" v-close-popup/>
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- ── Dialog Eliminar ────────────────────────────────────── -->
        <q-dialog v-model="confirmDeleteDialog" persistent>
            <q-card style="width: 500px; max-width: 95%;">
                <q-toolbar class="bg-negative text-white">
                    <q-icon name="warning" size="sm" class="q-mr-sm"/>
                    <q-toolbar-title class="text-weight-bold">Eliminar Préstamo</q-toolbar-title>
                </q-toolbar>
                <q-card-section class="q-pt-md">
                    <div class="text-subtitle1 text-weight-medium text-negative q-mb-md">⚠️ Esta acción NO se puede deshacer</div>
                    <div v-if="loanToDelete" class="text-body1">
                        <strong>¿Estás seguro que deseas eliminar este préstamo?</strong>
                        <div class="q-mt-md">
                            <strong>Solicitante:</strong> {{ loanToDelete.usuario?.nombre }}<br>
                            <strong>Estado:</strong> {{ loanToDelete.estado }}<br>
                            <strong>Fecha préstamo:</strong> {{ formatDate(loanToDelete.fecha_prestamo) }}
                        </div>
                        <div class="text-caption text-negative q-mt-md">
                            <q-icon name="info" size="xs"/> El stock NO será restaurado automáticamente
                        </div>
                    </div>
                </q-card-section>
                <q-card-actions align="right" class="q-pa-md">
                    <q-btn flat label="Cancelar" color="grey" v-close-popup @click="loanToDelete = null"/>
                    <q-btn label="Eliminar Préstamo" color="negative" icon="delete"
                        @click="executeDelete" :loading="submitting"/>
                </q-card-actions>
            </q-card>
        </q-dialog>

    </q-page>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { loansService } from '../../services/items.js';
import * as XLSX from 'xlsx';
import { generarPdfSalida } from '../../services/loanPdfService.js';

const $q = useQuasar();

// ── Estado global ─────────────────────────────────────────────────────────────
const loans        = ref([]);
const loading      = ref(false);
const error        = ref(null);
const searchFilter = ref('');
const estadoFiltro = ref(null);
const submitting   = ref(false);

// ── Diálogos secundarios ──────────────────────────────────────────────────────
const delayDialog         = ref(false);
const detailDialog        = ref(false);
const confirmDeleteDialog = ref(false);
const selectedLoan        = ref(null);
const loanToDelete        = ref(null);
const delayForm           = ref({ nueva_fecha_estimada: '' });

// ── Diálogo gestor de devoluciones ────────────────────────────────────────────
const returnManagerDialog = ref(false);
const managedLoan         = ref(null);   // loan completo que se está gestionando
const closingLoan         = ref(false);

/**
 * itemConfirmInputs: mapa reactivo por loanItem._id
 *   { [loanItemId]: { qty: number, obs: string } }
 */
const itemConfirmInputs = reactive({});

/**
 * confirmingItem: mapa reactivo de loading por loanItem._id
 *   { [loanItemId]: boolean }
 */
const confirmingItem = reactive({});

// ── Opciones de filtro ────────────────────────────────────────────────────────
const filterOptions = [
    { label: 'Todos',      value: null,        icon: 'list' },
    { label: 'Aprobados',  value: 'Aprobado',  icon: 'check_circle' },
    { label: 'Aplazados',  value: 'Aplazado',  icon: 'event_repeat' },
    { label: 'Vencidos',   value: 'Vencido',   icon: 'alarm_off' },
    { label: 'Devueltos',  value: 'Devuelto',  icon: 'assignment_turned_in' },
    { label: 'Rechazados', value: 'Rechazado', icon: 'cancel' }
];

const columns = [
    { name: 'id',             required: true, label: 'ID',               align: 'left',   field: '_id',              sortable: true, format: v => v.slice(-6).toUpperCase(), style: 'width:80px' },
    { name: 'item',           align: 'left',  label: 'Ítems del préstamo',field: r => r.items?.map(i => i.item?.nombre).join(', '), sortable: true, style: 'min-width:240px' },
    { name: 'solicitante',    align: 'left',  label: 'Solicitante',      field: r => r.usuario?.nombre, sortable: true, style: 'min-width:160px' },
    { name: 'fecha_prestamo', align: 'center',label: 'F. Préstamo',      field: 'fecha_prestamo',       sortable: true, style: 'min-width:130px' },
    { name: 'fecha_estimada', align: 'center',label: 'F. Devolución',    field: 'fecha_estimada',       sortable: true, style: 'min-width:130px' },
    { name: 'status',         align: 'center',label: 'Estado',           field: 'estado',               sortable: true, style: 'width:140px' },
    { name: 'actions',        label: 'Acciones', field: 'actions',       align: 'center',                               style: 'width:140px' }
];

// ── Computed ──────────────────────────────────────────────────────────────────
const filteredLoans = computed(() => {
    if (!estadoFiltro.value) return loans.value;
    if (estadoFiltro.value === 'Vencido') return loans.value.filter(isOverdue);
    return loans.value.filter(l => l.estado === estadoFiltro.value);
});
const overdueCount  = computed(() => loans.value.filter(isOverdue).length);
const minDelayDate  = computed(() => {
    if (!selectedLoan.value?.fecha_estimada) return '';
    const f = new Date(selectedLoan.value.fecha_estimada);
    f.setHours(f.getHours() + 1);
    return f.toISOString().slice(0, 16);
});

// ── Helpers de ítems ──────────────────────────────────────────────────────────
const getApprovedItems = (loan) =>
    (loan?.items || []).filter(li => li.estado_item === 'Aprobado');

const getReturnedItems = (loan) =>
    (loan?.items || []).filter(li => li.estado_item === 'Devuelto' || li.estado_item === 'Usado');

/**
 * Estado semántico de un loanItem individual:
 *  - 'completo'           → todo confirmado
 *  - 'pendiente_admin'    → hay notificaciones sin confirmar del usuario
 *  - 'parcial'            → confirmado parcialmente, esperando más notificaciones
 *  - 'pendiente_usuario'  → el usuario no ha notificado nada aún
 */
const getItemReturnStatus = (li) => {
    const confirmadas = li.cantidad_confirmada || 0;
    if (li.estado_item === 'Usado' || confirmadas >= li.cantidad_prestamo) return 'completo';
    const pendientesAdmin = (li.devoluciones_parciales || []).some(d => !d.confirmado && !d.no_recibida);
    if (pendientesAdmin) return 'pendiente_admin';
    if (confirmadas > 0) return 'parcial';
    return 'pendiente_usuario';
};

/** Unidades notificadas por el usuario pendientes de revisión del admin
 *  (excluye las ya confirmadas y las marcadas como no_recibida) */
const getItemPendingQty = (li) =>
    (li.devoluciones_parciales || [])
        .filter(d => !d.confirmado && !d.no_recibida)
        .reduce((s, d) => s + d.cantidad, 0);

/** Máximo que el admin puede confirmar ahora */
const getItemMaxConfirmable = (li) =>
    (li.cantidad_prestamo || 0) - (li.cantidad_confirmada || 0);

// ── Total de unidades por confirmar en un préstamo (para badge en tabla) ──────
const totalPendingConfirmations = (loan) =>
    getApprovedItems(loan).reduce((sum, li) => sum + getItemPendingQty(li), 0);

// ── ¿Se puede cerrar el préstamo? (todos los ítems completamente confirmados) ─
const canCloseLoan = (loan) => {
    const activos = getApprovedItems(loan);
    if (!activos.length) return false;
    // Puede cerrar si todos los no-consumibles están confirmados completamente.
    // Los consumibles no bloquean el cierre (el admin decide cuándo cerrar).
    return activos
        .filter(li => li.item?.tipo_categoria !== 'Consumible')
        .every(li => (li.cantidad_confirmada || 0) >= li.cantidad_prestamo);
};

// ── Helpers generales ─────────────────────────────────────────────────────────
const isOverdue    = (loan) => {
    if (!loan.fecha_estimada || ['Devuelto', 'Rechazado'].includes(loan.estado)) return false;
    return new Date(loan.fecha_estimada) < new Date();
};
const canDelay     = (loan) => ['Aprobado', 'Aplazado'].includes(loan.estado) && loan.fecha_estimada;
const getRowClass  = (row)  => isOverdue(row) ? 'loan-expired' : '';
const countByStatus= (s)    => loans.value.filter(l => l.estado === s).length;

/** Genera y abre el PDF de autorización de salida para portería */
const descargarPDF = (loan) => generarPdfSalida(loan);
/**
 * Devuelve el label y clase CSS del estado del préstamo para la tabla.
 * Si el préstamo está 'Devuelto' y todos sus ítems son consumibles → "Consumido"
 * Si es mixto (consumibles + devolutivos) → "Dev./Consumido"
 * En cualquier otro caso → estado normal del préstamo
 */
const getLoanDisplayEstado = (loan) => {
    if (loan.estado !== 'Devuelto') {
        return { label: loan.estado, css: loan.estado.toLowerCase() };
    }
    const items = (loan.items || []).filter(li => !['Eliminado', 'Rechazado', 'Pendiente'].includes(li.estado_item));
    if (!items.length) return { label: 'Devuelto', css: 'devuelto' };
    const todosUsados   = items.every(li => li.estado_item === 'Usado' || li.item?.tipo_categoria === 'Consumible');
    const algunoUsado   = items.some(li => li.estado_item === 'Usado');
    const algunoDevuelto = items.some(li => li.estado_item === 'Devuelto');
    if (todosUsados)                    return { label: 'Consumido',       css: 'consumido' };
    if (algunoUsado && algunoDevuelto)  return { label: 'Dev./Consumido',  css: 'mixto' };
    return { label: 'Devuelto', css: 'devuelto' };
};

/** Devuelve el color Quasar correspondiente al estado de un préstamo */
const getStatusColor = (estado) => {
    const map = {
        'Pendiente': 'orange',
        'Aprobado':  'positive',
        'Aplazado':  'blue-6',
        'Devuelto':  'teal',
        'Rechazado': 'negative',
    };
    return map[estado] || 'grey';
};

// ── Gestor de devoluciones ────────────────────────────────────────────────────

const openReturnManager = (loan) => {
    managedLoan.value = loan;
    // Inicializar inputs para cada ítem aprobado
    for (const li of getApprovedItems(loan)) {
        const pending = getItemPendingQty(li);
        itemConfirmInputs[li._id] = { qty: pending > 0 ? pending : 0, obs: '' };
        confirmingItem[li._id]    = false;
    }
    returnManagerDialog.value = true;
};

const closeReturnManager = () => {
    managedLoan.value = null;
};

const setItemInput = (loanItemId, field, value) => {
    if (!itemConfirmInputs[loanItemId]) itemConfirmInputs[loanItemId] = { qty: 0, obs: '' };
    itemConfirmInputs[loanItemId][field] = value;
};

/**
 * Valida si el input de qty de un loanItem tiene error:
 * - vacío / null / undefined
 * - no entero
 * - negativo
 * - supera el máximo confirmable
 */
const hasItemQtyError = (li) => {
    const input = itemConfirmInputs[li._id];
    if (!input) return true;
    const v = input.qty;
    if (v === null || v === undefined || v === '') return true;
    const n = Number(v);
    if (isNaN(n) || !Number.isInteger(n)) return true;
    if (n < 0) return true;
    if (n > getItemMaxConfirmable(li)) return true;
    return false;
};

/**
 * Confirma recepción de unidades de UN ítem específico.
 * Llama a /confirmar-parcial con el loanItemId correspondiente.
 */
const confirmSingleItem = async (loan, li) => {
    const input = itemConfirmInputs[li._id];
    if (input?.qty === null || input?.qty === undefined || input?.qty === '') return;
    if (hasItemQtyError(li)) return;

    confirmingItem[li._id] = true;
    try {
        const result = await loansService.confirmPartialReturn(loan._id, {
            loanItemId:            li._id,
            cantidadConfirmada:    Number(input.qty),
            observacion_recepcion: input.obs || undefined
        });

        $q.notify({
            type: 'positive',
            message: result.cerrado
                ? `✅ Préstamo cerrado. Ítem "${li.item?.nombre}" completamente devuelto.`
                : `✅ ${input.qty} ud. de "${li.item?.nombre}" confirmadas y añadidas al stock.`,
            position: 'top', timeout: 4000
        });

        // Refrescar datos del loan gestionado sin cerrar el diálogo
        await refreshManagedLoan(loan._id);
    } catch (err) {
        $q.notify({
            type: 'negative',
            message: err?.response?.data?.message || 'Error al confirmar devolución',
            position: 'top', timeout: 4000
        });
    } finally {
        confirmingItem[li._id] = false;
    }
};


/**
 * Refresca el loan en `managedLoan` y en la lista `loans` sin cerrar el diálogo.
 */
const refreshManagedLoan = async (loanId) => {
    await loadLoans();
    // Actualizar también managedLoan para que el diálogo refleje el estado actualizado
    const updated = loans.value.find(l => l._id === loanId);
    if (updated) {
        managedLoan.value = updated;
        // Re-inicializar inputs para ítems que aún tienen pendientes
        for (const li of getApprovedItems(updated)) {
            const pending = getItemPendingQty(li);
            if (!itemConfirmInputs[li._id]) {
                itemConfirmInputs[li._id] = { qty: pending || 1, obs: '' };
            } else {
                // Actualizar qty pero conservar obs si hay algo escrito
                itemConfirmInputs[li._id].qty = pending ?? 0;
            }
            confirmingItem[li._id] = false;
        }
    } else {
        // El préstamo fue cerrado
        returnManagerDialog.value = false;
        managedLoan.value = null;
    }
};

/** Cierra el préstamo completo (todos los ítems confirmados) */
const executeFinalReturn = async (loan) => {
    closingLoan.value = true;
    try {
        await loansService.return(loan._id);
        $q.notify({ type: 'positive', message: '✅ Préstamo cerrado exitosamente.', position: 'top', timeout: 4000 });
        returnManagerDialog.value = false;
        managedLoan.value = null;
        await loadLoans();
    } catch (err) {
        $q.notify({ type: 'negative', message: err?.response?.data?.message || 'Error al cerrar el préstamo', position: 'top', timeout: 4000 });
    } finally {
        closingLoan.value = false;
    }
};

// ── Aplazar ───────────────────────────────────────────────────────────────────
const openDelayDialog = (loan) => {
    selectedLoan.value = loan;
    const d = new Date(loan.fecha_estimada);
    d.setDate(d.getDate() + 7);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    delayForm.value.nueva_fecha_estimada = d.toISOString().slice(0, 16);
    delayDialog.value = true;
};

const submitDelay = async () => {
    if (!selectedLoan.value) return;
    submitting.value = true;
    try {
        await loansService.delay(selectedLoan.value._id, new Date(delayForm.value.nueva_fecha_estimada).toISOString());
        $q.notify({ type: 'positive', message: 'Préstamo aplazado exitosamente', position: 'top', timeout: 3000 });
        delayDialog.value = false;
        await loadLoans();
    } catch (err) {
        $q.notify({ type: 'negative', message: err.response?.data?.message || 'No se pudo aplazar', position: 'top', timeout: 4000 });
    } finally {
        submitting.value = false;
    }
};

// ── Detalle / Eliminar ────────────────────────────────────────────────────────
const openDetailDialog = (loan) => { selectedLoan.value = loan; detailDialog.value = true; };
const confirmDelete    = (loan) => { loanToDelete.value = loan; confirmDeleteDialog.value = true; };

const executeDelete = async () => {
    if (!loanToDelete.value) return;
    submitting.value = true;
    try {
        await loansService.delete(loanToDelete.value._id);
        $q.notify({ type: 'info', message: 'Préstamo eliminado', position: 'top', timeout: 3000 });
        confirmDeleteDialog.value = false;
        await loadLoans();
    } catch (err) {
        $q.notify({ type: 'negative', message: err.response?.data?.message || 'No se pudo eliminar', position: 'top', timeout: 4000 });
    } finally {
        loanToDelete.value = null;
        submitting.value   = false;
    }
};

// ── Carga de datos ────────────────────────────────────────────────────────────
const loadLoans = async () => {
    loading.value = true;
    error.value   = null;
    try {
        const data  = await loansService.getAll();
        loans.value = data.filter(l => l.estado !== 'Pendiente');
    } catch (err) {
        error.value = 'Error al cargar los préstamos.';
        $q.notify({ type: 'negative', message: 'No se pudieron cargar los préstamos', position: 'top', timeout: 3000 });
    } finally {
        loading.value = false;
    }
};

// ── Utilidades ────────────────────────────────────────────────────────────────
const formatDate = (ds) => {
    if (!ds) return 'N/A';
    return new Date(ds).toLocaleString('es-CO', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
};
const formatDateExcel = (ds) => ds ? new Date(ds).toLocaleString('es-CO') : '';

const exportToExcel = () => {
    try {
        const rows = filteredLoans.value.map(l => ({
            'ID':                        l._id.slice(-8).toUpperCase(),
            'Ítems':                     (l.items || []).map(i => i.item?.nombre).filter(Boolean).join(' | '),
            'Solicitante':               l.usuario?.nombre || 'N/A',
            'Email':                     l.usuario?.email  || 'N/A',
            'Fecha Solicitud':           formatDateExcel(l.fecha_solicitud),
            'Fecha Préstamo':            formatDateExcel(l.fecha_prestamo),
            'Fecha Estimada Devolución': formatDateExcel(l.fecha_estimada),
            'Fecha Real Devolución':     formatDateExcel(l.fecha_retorno),
            'Estado':                    l.estado,
            'Vencido':                   isOverdue(l) ? 'Sí' : 'No',
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Préstamos');
        XLSX.writeFile(wb, `prestamos_${new Date().toISOString().slice(0,10)}.xlsx`);
        $q.notify({ type: 'positive', message: 'Excel descargado', position: 'top', timeout: 2000 });
    } catch {
        $q.notify({ type: 'negative', message: 'Error al exportar', position: 'top', timeout: 3000 });
    }
};

onMounted(loadLoans);
</script>

<style scoped>
.page-bg { background: #f1f5f9; min-height: 100vh; }

/* Header */
.header-icon-wrap {
    width:38px;height:38px;border-radius:10px;
    background:linear-gradient(135deg,#0d9488,#2563eb);
    display:flex;align-items:center;justify-content:center;
}
.lh-tight { line-height:1.2; }
.action-btn { border-radius:8px; }

/* Stat chips */
.stat-chip {
    border-radius:12px;padding:12px 14px;
    display:flex;align-items:center;gap:8px;
    cursor:pointer;transition:all .2s;
    border:2px solid transparent;background:white;
    box-shadow:0 1px 3px rgba(0,0,0,.06);
}
.stat-chip:hover { transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.1); }
.stat-chip--active { border-color:currentColor!important; }
.stat-number { font-size:20px;font-weight:800;line-height:1; }
.stat-label  { font-size:11px;font-weight:600;opacity:.7; }
.stat-chip--green  { color:#15803d; }
.stat-chip--orange { color:#c2410c; }
.stat-chip--red    { color:#dc2626; }
.stat-chip--blue   { color:#1d4ed8; }

/* Filter tabs */
.filter-tab {
    padding:7px 14px;border-radius:20px;font-size:13px;
    font-weight:600;cursor:pointer;transition:all .18s;
    background:white;color:#64748b;border:1.5px solid #e2e8f0;
    display:inline-flex;align-items:center;
}
.filter-tab:hover { background:#f8fafc;border-color:#94a3b8; }
.filter-tab--active { background:#0d9488;color:white;border-color:#0d9488; }

/* Table */
.table-card { border-radius:14px;border:1px solid #e2e8f0;overflow:hidden; }
.data-table :deep(thead tr th) {
    background:#f8fafc;font-weight:700;font-size:11px;
    text-transform:uppercase;letter-spacing:.4px;color:#475569;
    border-bottom:2px solid #e2e8f0!important;
}
.data-table :deep(tbody tr td) { padding:10px 12px;border-bottom:1px solid #f1f5f9; }
.data-table :deep(tbody tr:hover td) { background:#f8fafc!important; }
.search-input { min-width:200px;max-width:280px; }

/* Overdue */
.overdue-pill {
    display:inline-flex;align-items:center;background:#dc2626;color:white;
    border-radius:4px;padding:2px 6px;font-size:10px;font-weight:700;
    margin-top:3px;letter-spacing:.3px;
}
.loan-expired { background:#fff5f5!important; }
.loan-expired :deep(td) { border-bottom-color:#fecaca!important; }

/* Status badges */
.status-badge {
    display:inline-block;padding:3px 10px;border-radius:20px;
    font-size:11px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;
}
.status-badge--aprobado  { background:#dcfce7;color:#15803d; }
.status-badge--aplazado  { background:#fff7ed;color:#c2410c; }
.status-badge--devuelto  { background:#dbeafe;color:#1d4ed8; }
.status-badge--rechazado { background:#fee2e2;color:#b91c1c; }
.status-badge--pendiente { background:#f1f5f9;color:#475569; }
.status-badge--consumido { background:#fff3e0;color:#e65100; }
.status-badge--mixto     { background:#ede7f6;color:#6a1b9a; }

/* ── Return Manager Dialog ─────────────────────────────────────────────── */
.return-manager-card { display:flex;flex-direction:column;height:100%; }

.info-pill {
    background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;
    padding:8px 12px;font-size:13px;display:flex;align-items:center;
}

/* Tarjeta de ítem */
.item-return-card {
    border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;
    background:white;transition:border-color .2s;
}
.item-card-header {
    background:#f8fafc;border-bottom:1px solid #e2e8f0;
}
.item-type-dot {
    width:10px;height:10px;border-radius:50%;flex-shrink:0;
}
.dot-orange { background:#f97316; }
.dot-blue   { background:#3b82f6; }

/* Panel de confirmación inline */
.confirm-inline-panel {
    background:#f0fdfa;border:1.5px dashed #2dd4bf;border-radius:8px;
}
.all-confirmed-banner {
    background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;
    padding:6px 10px;display:flex;align-items:center;
}

/* Historial */
.devolucion-row { padding:4px 0; }

/* Ítems devueltos */
.returned-item-row {
    background:#f8fafc;border-radius:6px;
    display:flex;align-items:center;
}

/* Responsive */
@media (max-width:599px) {
    .page-bg { padding:10px 8px!important; }
    .stat-chip { padding:10px;gap:6px; }
    .stat-number { font-size:17px; }
    .filter-tab { padding:9px 12px;font-size:12px; }
    .search-input { min-width:140px;max-width:100%; }
}
@media (max-width:400px) { .stat-label { display:none; } }
</style>