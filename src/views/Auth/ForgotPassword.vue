<template>
    <q-layout view="lHh Lpr lff" class="bg-gradient">
        <q-page-container>
            <q-page class="flex flex-center">
                <q-card class="recovery-card" flat bordered>
                    <!-- Header -->
                    <q-card-section class="text-center q-pt-xl">
                        <q-avatar size="80px" color="primary" text-color="white" class="q-mb-md">
                            <q-icon name="lock_reset" size="48px" />
                        </q-avatar>
                        <div class="text-h5 text-weight-bold text-dark">
                            ¿Olvidaste tu contraseña?
                        </div>
                        <div class="text-subtitle2 text-grey-7 q-mt-sm">
                            No te preocupes, te enviaremos instrucciones por email
                        </div>
                    </q-card-section>

                    <!-- Estado de éxito -->
                    <q-card-section v-if="emailSent" class="q-pa-lg">
                        <q-banner class="bg-positive text-white" rounded>
                            <template v-slot:avatar>
                                <q-icon name="mark_email_read" size="lg" />
                            </template>
                            <div class="text-h6">¡Email enviado!</div>
                            <div class="q-mt-sm">
                                Si el email <strong>{{ submittedEmail }}</strong> está registrado,
                                recibirás un correo con instrucciones.
                            </div>
                        </q-banner>

                        <div class="q-mt-lg text-center">
                            <q-icon name="info" color="info" class="q-mr-sm" />
                            <span class="text-grey-7">Revisa tu bandeja de entrada y spam</span>
                        </div>

                        <div class="q-mt-xl text-center">
                            <q-btn
                                flat
                                label="Volver al inicio"
                                color="primary"
                                icon="arrow_back"
                                @click="router.push('/')"
                            />
                        </div>
                    </q-card-section>

                    <!-- Formulario -->
                    <q-card-section v-else class="q-pa-lg">
                        <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
                            <q-input
                                v-model="email"
                                type="email"
                                label="Email"
                                outlined
                                autofocus
                                :rules="[
                                    val => !!val || 'El email es requerido',
                                    val => /.+@.+\..+/.test(val) || 'Email inválido'
                                ]"
                            >
                                <template v-slot:prepend>
                                    <q-icon name="email" />
                                </template>
                            </q-input>

                            <q-banner class="bg-blue-1 text-primary" rounded dense>
                                <template v-slot:avatar>
                                    <q-icon name="info" color="primary" />
                                </template>
                                Enlace válido por 1 hora
                            </q-banner>

                            <div class="q-mt-lg">
                                <q-btn
                                    type="submit"
                                    label="Enviar enlace de recuperación"
                                    color="primary"
                                    icon="send"
                                    class="full-width"
                                    size="lg"
                                    :loading="loading"
                                />
                            </div>

                            <div class="text-center q-mt-md">
                                <q-btn
                                    flat
                                    label="Volver al inicio"
                                    color="grey-7"
                                    icon="arrow_back"
                                    @click="router.push('/')"
                                />
                            </div>
                        </q-form>
                    </q-card-section>
                </q-card>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import api from '../../services/api.js';

const router = useRouter();
const $q = useQuasar();

const email = ref('');
const loading = ref(false);
const emailSent = ref(false);
const submittedEmail = ref('');

const handleSubmit = async () => {
    loading.value = true;

    try {
        await api.post('/auth/request-password-reset', {
            email: email.value
        });

        submittedEmail.value = email.value;
        emailSent.value = true;

    } catch (error) {
        $q.notify({
            type: 'info',
            message: 'Si el email existe, recibirás instrucciones',
            position: 'top',
            timeout: 5000
        });
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.bg-gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}

.recovery-card {
    width: 100%;
    max-width: 500px;
    margin: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}
</style>