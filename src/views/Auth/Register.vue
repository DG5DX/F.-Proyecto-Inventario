<template>
    <q-page class="row items-center justify-center bg-dark q-pa-md"
        style="background-image: url('https://source.unsplash.com/random/1920x1080/?nature,forest,blur'); background-size: cover; background-position: center;">

        <q-card class="glass-card q-pa-lg text-white" style="width: 450px; max-width: 95%;">

            <div class="glass-avatar-container q-mb-md">
                <q-icon name="person_add" size="70px" class="glass-avatar" />
            </div>

            <q-card-section class="text-center q-pt-none q-mt-xl">
                <div class="text-h5 text-weight-bold q-mb-xs" style="color:white;">Crear Cuenta</div>
                <div class="text-subtitle1 text-grey-4">Regístrate para usar el Inventario de Aula</div>
            </q-card-section>

            <q-card-section>
                <q-form @submit="handleRegister" class="q-gutter-md">
                    <q-input 
                        v-model="nombre" 
                        dark 
                        filled 
                        bg-color="rgba(255, 255, 255, 0.1)" 
                        input-class="text-white"
                        label-color="grey-4" 
                        type="text" 
                        label="Nombre Completo" 
                        clearable 
                        :rules="[
                            val => (val && val.length > 0) || 'El nombre es requerido',
                            val => val.length <= 100 || 'Máximo 100 caracteres'
                        ]"
                    >
                        <template v-slot:prepend>
                            <q-icon name="person" color="white" />
                        </template>
                    </q-input>

                    <q-input 
                        v-model="email" 
                        dark 
                        filled 
                        bg-color="rgba(255, 255, 255, 0.1)" 
                        input-class="text-white"
                        label-color="grey-4" 
                        type="email" 
                        label="Correo Electrónico" 
                        clearable 
                        :rules="[
                            val => (val && val.length > 0) || 'El email es requerido',
                            val => /.+@.+\..+/.test(val) || 'Ingresa un email válido',
                            val => val.length <= 350 || 'Máximo 350 caracteres'
                        ]"
                    >
                        <template v-slot:prepend>
                            <q-icon name="email" color="white" />
                        </template>
                    </q-input>

                    <q-input 
                        v-model="password" 
                        dark 
                        filled 
                        bg-color="rgba(255, 255, 255, 0.1)" 
                        input-class="text-white"
                        label-color="grey-4" 
                        :type="showPassword ? 'text' : 'password'" 
                        label="Contraseña (mín. 8 caracteres)" 
                        clearable 
                        :rules="[
                            val => (val && val.length > 0) || 'La contraseña es requerida',
                            val => val.length >= 8 || 'Mínimo 8 caracteres'
                        ]"
                    >
                        <template v-slot:prepend>
                            <q-icon name="lock" color="white" />
                        </template>
                        <template v-slot:append>
                            <q-icon 
                                :name="showPassword ? 'visibility' : 'visibility_off'" 
                                color="white" 
                                class="cursor-pointer"
                                @click="showPassword = !showPassword"
                            />
                        </template>
                    </q-input>

                    <q-input 
                        v-model="passwordConfirm" 
                        dark 
                        filled 
                        bg-color="rgba(255, 255, 255, 0.1)"
                        input-class="text-white" 
                        label-color="grey-4" 
                        :type="showPasswordConfirm ? 'text' : 'password'" 
                        label="Confirmar Contraseña"
                        clearable 
                        :rules="[
                            val => (val && val.length > 0) || 'Confirma la contraseña',
                            val => val === password || 'Las contraseñas no coinciden'
                        ]"
                    >
                        <template v-slot:prepend>
                            <q-icon name="lock_reset" color="white" />
                        </template>
                        <template v-slot:append>
                            <q-icon 
                                :name="showPasswordConfirm ? 'visibility' : 'visibility_off'" 
                                color="white" 
                                class="cursor-pointer"
                                @click="showPasswordConfirm = !showPasswordConfirm"
                            />
                        </template>
                    </q-input>

                    <q-btn 
                        label="REGISTRARME" 
                        type="submit" 
                        color="primary" 
                        text-color="black" 
                        size="lg"
                        class="full-width q-mt-lg" 
                        rounded 
                        :loading="loading" 
                        :disable="loading"
                    >
                        <template v-slot:loading>
                            <q-spinner-tail class="on-left" color="black" />
                            Procesando...
                        </template>
                    </q-btn>

                </q-form>
            </q-card-section>

            <q-card-section class="text-center q-pt-lg">
                <p class="text-grey-4 text-body2">
                    ¿Ya tienes cuenta?
                    <router-link to="/" class="text-primary text-weight-medium">Inicia Sesión</router-link>
                </p>
            </q-card-section>
        </q-card>
    </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import axios from 'axios';

const nombre = ref('');
const email = ref('');
const password = ref('');
const passwordConfirm = ref('');
const showPassword = ref(false);
const showPasswordConfirm = ref(false);
const loading = ref(false);

const router = useRouter();
const $q = useQuasar();

// Configura la URL base de tu API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const handleRegister = async () => {
    loading.value = true;

    try {
        // Realiza la petición al endpoint de registro
        const response = await axios.post(`${API_URL}/auth/register`, {
            nombre: nombre.value,
            email: email.value,
            password: password.value
        });

        // El backend devuelve: { token, nombre, rol }
        const { token, nombre: userName, rol } = response.data;

        // Guarda el token en localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('userNombre', userName);
        localStorage.setItem('userRol', rol);

        // Configura el token en los headers de axios para futuras peticiones
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Notificación de éxito
        $q.notify({
            type: 'positive',
            message: `¡Bienvenido ${userName}! Tu cuenta ha sido creada exitosamente.`,
            position: 'top',
            icon: 'check_circle',
            timeout: 3000
        });

        // Redirige según el rol del usuario
        setTimeout(() => {
            if (rol === 'Admin') {
                router.push('/admin/dashboard');
            } else {
                router.push('/user/dashboard');
            }
        }, 500);

    } catch (error) {
        // Manejo de errores
        let errorMessage = 'Error de conexión con el servidor.';

        if (error.response) {
            // El servidor respondió con un código de error
            switch (error.response.status) {
                case 409:
                    errorMessage = 'Este correo electrónico ya está registrado. Por favor, inicia sesión o usa otro email.';
                    break;
                case 422:
                    // Errores de validación
                    if (error.response.data?.errors && error.response.data.errors.length > 0) {
                        const validationErrors = error.response.data.errors
                            .map(err => err.msg)
                            .join(', ');
                        errorMessage = `Datos inválidos: ${validationErrors}`;
                    } else {
                        errorMessage = 'Datos inválidos. Verifica los campos del formulario.';
                    }
                    break;
                case 500:
                    errorMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
                    break;
                default:
                    errorMessage = error.response.data?.message || errorMessage;
            }
        } else if (error.request) {
            // La petición se hizo pero no hubo respuesta
            errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
        }

        $q.notify({
            type: 'negative',
            message: errorMessage,
            position: 'top',
            icon: 'warning',
            timeout: 4000
        });

        console.error('Error en registro:', error);
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.glass-card {
    position: relative;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    animation: fadeIn 0.8s ease-out;
}

.glass-avatar-container {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: center;
    align-items: center;
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    z-index: 1;
}

.glass-avatar {
    color: white;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.router-link-active,
.router-link-exact-active,
a {
    text-decoration: none;
}
</style>