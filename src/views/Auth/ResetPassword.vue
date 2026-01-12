<template>
    <q-layout view="lHh Lpr lff" class="bg-gradient">
        <q-page-container>
            <q-page class="flex flex-center">
                <q-card class="reset-card" flat bordered>
                    <!-- Verificando token -->
                    <q-card-section v-if="verifying" class="text-center q-pa-xl">
                        <q-spinner-dots size="64px" color="primary" />
                        <div class="text-h6 text-grey-6 q-mt-md">
                            Verificando enlace...
                        </div>
                    </q-card-section>

                    <!-- Token inválido -->
                    <q-card-section v-else-if="!tokenValid" class="q-pa-xl">
                        <div class="text-center">
                            <q-avatar size="80px" color="negative" text-color="white" class="q-mb-md">
                                <q-icon name="error" size="48px" />
                            </q-avatar>
                            <div class="text-h5 text-weight-bold text-negative q-mb-sm">
                                Enlace inválido o expirado
                            </div>
                            <div class="text-subtitle2 text-grey-7 q-mb-lg">
                                Este enlace ya no es válido.
                            </div>

                            <q-banner class="bg-warning-1 text-warning q-mb-lg" rounded>
                                <template v-slot:avatar>
                                    <q-icon name="schedule" color="warning" />
                                </template>
                                Los enlaces expiran después de 1 hora
                            </q-banner>

                            <div class="q-gutter-md">
                                <q-btn
                                    label="Solicitar nuevo enlace"
                                    color="primary"
                                    icon="lock_reset"
                                    @click="router.push('/forgot-password')"
                                    class="full-width"
                                />
                                <q-btn
                                    flat
                                    label="Volver al inicio"
                                    color="grey-7"
                                    @click="router.push('/')"
                                    class="full-width"
                                />
                            </div>
                        </div>
                    </q-card-section>

                    <!-- Éxito -->
                    <q-card-section v-else-if="resetSuccess" class="q-pa-xl">
                        <div class="text-center">
                            <q-avatar size="80px" color="positive" text-color="white" class="q-mb-md">
                                <q-icon name="check_circle" size="48px" />
                            </q-avatar>
                            <div class="text-h5 text-weight-bold text-positive q-mb-sm">
                                ¡Contraseña restablecida!
                            </div>
                            <div class="text-subtitle2 text-grey-7 q-mb-lg">
                                Tu contraseña ha sido actualizada.
                            </div>

                            <q-btn
                                label="Iniciar sesión"
                                color="primary"
                                icon="login"
                                @click="router.push('/')"
                                class="full-width"
                                size="lg"
                            />
                        </div>
                    </q-card-section>

                    <!-- Formulario -->
                    <q-card-section v-else class="q-pa-lg">
                        <div class="text-center q-mb-lg">
                            <q-avatar size="80px" color="primary" text-color="white" class="q-mb-md">
                                <q-icon name="vpn_key" size="48px" />
                            </q-avatar>
                            <div class="text-h5 text-weight-bold text-dark">
                                Nueva contraseña
                            </div>
                            <div class="text-subtitle2 text-grey-7 q-mt-sm">
                                Para: <strong>{{ userEmail }}</strong>
                            </div>
                        </div>

                        <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
                            <q-input
                                v-model="newPassword"
                                :type="showPassword ? 'text' : 'password'"
                                label="Nueva contraseña"
                                outlined
                                autofocus
                                counter
                                :rules="[
                                    val => !!val || 'Requerida',
                                    val => val.length >= 8 || 'Mínimo 8 caracteres'
                                ]"
                            >
                                <template v-slot:prepend>
                                    <q-icon name="lock" />
                                </template>
                                <template v-slot:append>
                                    <q-icon
                                        :name="showPassword ? 'visibility_off' : 'visibility'"
                                        class="cursor-pointer"
                                        @click="showPassword = !showPassword"
                                    />
                                </template>
                            </q-input>

                            <q-input
                                v-model="confirmPassword"
                                :type="showConfirm ? 'text' : 'password'"
                                label="Confirmar contraseña"
                                outlined
                                counter
                                :rules="[
                                    val => !!val || 'Requerida',
                                    val => val === newPassword || 'No coinciden'
                                ]"
                            >
                                <template v-slot:prepend>
                                    <q-icon name="lock" />
                                </template>
                                <template v-slot:append>
                                    <q-icon
                                        :name="showConfirm ? 'visibility_off' : 'visibility'"
                                        class="cursor-pointer"
                                        @click="showConfirm = !showConfirm"
                                    />
                                </template>
                            </q-input>

                            <div class="q-mt-lg">
                                <q-btn
                                    type="submit"
                                    label="Restablecer contraseña"
                                    color="primary"
                                    icon="check"
                                    class="full-width"
                                    size="lg"
                                    :loading="submitting"
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
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import api from '../../services/api.js';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const verifying = ref(true);
const tokenValid = ref(false);
const resetSuccess = ref(false);
const userEmail = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirm = ref(false);
const submitting = ref(false);
const token = ref(route.query.token || '');

onMounted(async () => {
    if (!token.value) {
        tokenValid.value = false;
        verifying.value = false;
        return;
    }

    try {
        const { data } = await api.get(`/auth/verify-reset-token/${token.value}`);
        
        if (data.valid) {
            tokenValid.value = true;
            userEmail.value = data.email;
        }
    } catch (error) {
        tokenValid.value = false;
    } finally {
        verifying.value = false;
    }
});

const handleSubmit = async () => {
    submitting.value = true;

    try {
        await api.post('/auth/reset-password', {
            token: token.value,
            newPassword: newPassword.value
        });

        resetSuccess.value = true;

        $q.notify({
            type: 'positive',
            message: 'Contraseña restablecida exitosamente',
            position: 'top',
            icon: 'check_circle'
        });

    } catch (error) {
        $q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'Error al restablecer',
            position: 'top',
            icon: 'error'
        });
    } finally {
        submitting.value = false;
    }
};
</script>

<style scoped>
.bg-gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}

.reset-card {
    width: 100%;
    max-width: 550px;
    margin: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.bg-warning-1 {
    background-color: #fff4e5;
}

.text-warning {
    color: #f57c00;
}
</style>