<template>
    <q-layout view="lHh Lpr lff" class="bg-gradient">
        <q-page-container>
            <q-page class="flex flex-center">
                <q-card class="recovery-card" flat bordered>

                    <q-card-section class="text-center q-pt-xl q-pb-sm">
                        <q-avatar size="80px" color="primary" text-color="white" class="q-mb-md">
                            <q-icon name="lock_reset" size="48px" />
                        </q-avatar>
                        <div class="text-h5 text-weight-bold text-dark">Recuperar acceso</div>
                        <div class="text-subtitle2 text-grey-7 q-mt-sm">
                            Selecciona cómo quieres recuperar tu cuenta
                        </div>
                    </q-card-section>

                    <q-tabs v-model="tab" dense align="justify" class="text-grey-7"
                        active-color="primary" indicator-color="primary">
                        <q-tab name="password" icon="lock" label="Olvidé mi contraseña" no-caps/>
                        <q-tab name="email" icon="manage_search" label="No recuerdo mi correo" no-caps/>
                    </q-tabs>

                    <q-separator/>

                    <q-tab-panels v-model="tab" animated>

                        <!-- TAB 1: Recuperar contraseña -->
                        <q-tab-panel name="password" class="q-pa-lg">
                            <div v-if="emailSent">
                                <q-banner class="bg-positive text-white" rounded>
                                    <template v-slot:avatar>
                                        <q-icon name="mark_email_read" size="lg" />
                                    </template>
                                    <div class="text-h6">¡Correo enviado!</div>
                                    <div class="q-mt-sm">
                                        Si el correo <strong>{{ submittedEmail }}</strong> está registrado,
                                        recibirás las instrucciones.
                                    </div>
                                </q-banner>
                                <div class="q-mt-md text-center text-caption text-grey-6">
                                    <q-icon name="info" color="info" class="q-mr-xs"/>
                                    Revisa tu bandeja de entrada y carpeta de spam
                                </div>
                                <div class="q-mt-xl text-center">
                                    <q-btn flat label="Volver al inicio" color="primary"
                                        icon="arrow_back" @click="router.push('/')"/>
                                </div>
                            </div>

                            <q-form v-else @submit.prevent="handlePasswordReset" class="q-gutter-md">
                                <q-input v-model="resetEmail" type="email" label="Correo electrónico"
                                    outlined autofocus
                                    :rules="[
                                        val => !!val || 'El correo es requerido',
                                        val => /.+@.+\..+/.test(val) || 'Correo inválido'
                                    ]">
                                    <template v-slot:prepend><q-icon name="email"/></template>
                                </q-input>

                                <q-banner class="bg-blue-1 text-primary" rounded dense>
                                    <template v-slot:avatar><q-icon name="info" color="primary"/></template>
                                    El enlace de recuperación es válido por 1 hora
                                </q-banner>

                                <q-btn type="submit" label="Enviar enlace de recuperación"
                                    color="primary" icon="send" class="full-width" size="lg"
                                    :loading="loadingReset"/>

                                <div class="text-center q-mt-sm">
                                    <q-btn flat label="Volver al inicio" color="grey-7"
                                        icon="arrow_back" @click="router.push('/')"/>
                                </div>
                            </q-form>
                        </q-tab-panel>

                        <!-- TAB 2: Recordar correo por nombre -->
                        <q-tab-panel name="email" class="q-pa-lg">

                            <template v-if="!hintSent">
                                <div class="text-body2 text-grey-7 q-mb-md text-center">
                                    Escribe tu nombre o parte de él. Te mostraremos las cuentas
                                    que coincidan para que puedas reconocer la tuya.
                                </div>

                                <div class="search-form-container">
                                    <q-form @submit.prevent="handleHintSearch" class="q-gutter-sm">
                                        <q-input v-model="hintNombre" label="Tu nombre" outlined clearable
                                            hint="Ej: Juan, Pérez, Juan Pér…"
                                            :rules="[val => (val && val.trim().length >= 2) || 'Ingresa al menos 2 caracteres']">
                                            <template v-slot:prepend><q-icon name="person_search"/></template>
                                        </q-input>
                                        <q-btn type="submit" label="Buscar" color="teal"
                                            icon="search" class="full-width q-mt-sm" size="lg"
                                            :loading="loadingHint"/>
                                    </q-form>
                                </div>

                                <div v-if="searched" class="q-mt-lg results-wrapper">
                                    <div v-if="hints.length === 0" class="no-results-container">
                                        <q-banner class="bg-orange-1 text-orange-9" rounded>
                                            <template v-slot:avatar><q-icon name="search_off" color="orange-8"/></template>
                                            <div class="text-weight-bold">Sin resultados</div>
                                            <div class="text-caption q-mt-xs">
                                                No encontramos ninguna cuenta con ese nombre.
                                                Intenta con una parte diferente de tu nombre.
                                            </div>
                                        </q-banner>
                                    </div>

                                    <div v-else class="results-container">
                                        <div class="text-caption text-grey-6 q-mb-sm text-center">
                                            <q-icon name="info" size="14px" class="q-mr-xs"/>
                                            El correo está parcialmente oculto. ¿Reconoces alguno?
                                            Haz clic en <strong>Enviarme mi correo</strong> y recibirás
                                            la dirección completa en tu bandeja de entrada.
                                        </div>

                                        <q-list bordered separator class="rounded-borders results-list">
                                            <q-item v-for="hint in hints" :key="hint.emailHint"
                                                class="q-py-sm">
                                                <q-item-section avatar>
                                                    <q-avatar color="teal-1" text-color="teal" size="38px">
                                                        <q-icon name="person"/>
                                                    </q-avatar>
                                                </q-item-section>
                                                <q-item-section>
                                                    <q-item-label class="text-weight-bold text-dark">
                                                        {{ hint.nombre }}
                                                    </q-item-label>
                                                    <q-item-label caption class="text-teal-8 text-weight-medium"
                                                        style="font-size:13px; letter-spacing:.3px;">
                                                        <q-icon name="email" size="13px" class="q-mr-xs"/>
                                                        {{ hint.emailHint }}
                                                    </q-item-label>
                                                </q-item-section>
                                                <q-item-section side>
                                                    <q-btn unelevated dense no-caps size="sm" color="teal"
                                                        label="Enviarme mi correo"
                                                        icon="send"
                                                        :loading="sendingId === hint.userId"
                                                        @click="sendHintEmail(hint)"/>
                                                </q-item-section>
                                            </q-item>
                                        </q-list>

                                        <div class="text-center q-mt-md">
                                            <q-btn flat dense no-caps color="grey-7" icon="refresh"
                                                label="Buscar de nuevo"
                                                @click="searched = false; hints = []; hintNombre = ''"/>
                                        </div>
                                    </div>
                                </div>

                                <div class="text-center q-mt-lg">
                                    <q-btn flat label="Volver al inicio" color="grey-7"
                                        icon="arrow_back" @click="router.push('/')"/>
                                </div>
                            </template>

                            <template v-else>
                                <q-banner class="bg-positive text-white" rounded>
                                    <template v-slot:avatar>
                                        <q-icon name="mark_email_read" size="lg"/>
                                    </template>
                                    <div class="text-h6">¡Correo enviado!</div>
                                    <div class="q-mt-sm text-body2">
                                        Enviamos un correo a <strong>{{ sentEmailHint }}</strong> con
                                        tu dirección de acceso completa.
                                    </div>
                                </q-banner>

                                <div class="q-mt-md text-center text-caption text-grey-6">
                                    <q-icon name="info" color="info" class="q-mr-xs"/>
                                    Revisa tu bandeja de entrada y carpeta de spam
                                </div>

                                <q-banner class="bg-blue-1 text-blue-9 q-mt-md" rounded dense>
                                    <template v-slot:avatar><q-icon name="lightbulb" color="blue-7"/></template>
                                    <span class="text-caption">
                                        Con el correo que recibirás, ve a la pestaña
                                        <strong>"Olvidé mi contraseña"</strong> si también necesitas recuperarla.
                                    </span>
                                </q-banner>

                                <div class="text-center q-mt-lg row q-gutter-sm justify-center">
                                    <q-btn flat no-caps label="Buscar otra cuenta" color="grey-7"
                                        icon="refresh"
                                        @click="hintSent = false; searched = false; hints = []; hintNombre = ''"/>
                                    <q-btn flat label="Volver al inicio" color="primary"
                                        icon="arrow_back" @click="router.push('/')"/>
                                </div>
                            </template>

                        </q-tab-panel>

                    </q-tab-panels>
                </q-card>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import api from '../../services/api.js';

const router  = useRouter();
const route   = useRoute();
const $q      = useQuasar();
const tab     = ref('password');

onMounted(() => {
    if (route.query.tab === 'email') tab.value = 'email';
});

// Tab 1: Recuperar contraseña 
const resetEmail     = ref('');
const loadingReset   = ref(false);
const emailSent      = ref(false);
const submittedEmail = ref('');

const handlePasswordReset = async () => {
    loadingReset.value = true;
    try {
        await api.post('/auth/request-password-reset', { email: resetEmail.value });
        submittedEmail.value = resetEmail.value;
        emailSent.value = true;
    } catch {
        $q.notify({ type: 'info', message: 'Si el correo existe, recibirás las instrucciones', position: 'top', timeout: 5000 });
    } finally {
        loadingReset.value = false;
    }
};

// Tab 2: Recordar correo por nombre 
const hintNombre   = ref('');
const loadingHint  = ref(false);
const searched     = ref(false);
const hints        = ref([]);
const hintSent     = ref(false);
const sentEmailHint = ref('');
const sendingId    = ref(null);

const handleHintSearch = async () => {
    loadingHint.value = true;
    searched.value    = false;
    hints.value       = [];
    try {
        const { data } = await api.post('/auth/hint-email', { nombre: hintNombre.value.trim() });
        hints.value    = data.hints || [];
        searched.value = true;
    } catch {
        $q.notify({ type: 'negative', message: 'Error al buscar. Intenta de nuevo.', position: 'top' });
    } finally {
        loadingHint.value = false;
    }
};

const sendHintEmail = async (hint) => {
    sendingId.value = hint.userId;
    try {
        await api.post('/auth/send-email-hint', { userId: hint.userId });
        sentEmailHint.value = hint.emailHint;
        hintSent.value = true;
    } catch {
        $q.notify({ type: 'negative', message: 'No se pudo enviar el correo. Intenta de nuevo.', position: 'top' });
    } finally {
        sendingId.value = null;
    }
};
</script>

<style scoped>
.bg-gradient {
    background: linear-gradient(135deg, #39A900 0%, #2d8600 100%);
    min-height: 100vh;
}
.recovery-card {
    width: 100%;
    max-width: 560px;
    margin: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}
.rounded-borders { border-radius: 8px; }

.search-form-container {
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
}

.results-wrapper {
    display: flex;
    justify-content: center;
    width: 100%;
}

.results-container {
    max-width: 550px;
    width: 100%;
    margin-left: auto;
    margin-right: auto;
}

.no-results-container {
    max-width: 450px;
    margin-left: auto;
    margin-right: auto;
}

.results-list {
    width: 100%;
}

@media (max-width: 600px) {
    .search-form-container {
        max-width: 100%;
    }
    .results-container {
        max-width: 100%;
    }
    .no-results-container {
        max-width: 100%;
    }
    .recovery-card {
        max-width: 100%;
        margin: 10px;
    }
}
</style>