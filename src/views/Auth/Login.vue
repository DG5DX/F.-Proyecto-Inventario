<template>
    <q-page class="row items-center justify-center bg-dark q-pa-md"
        style="background-image: url('https://source.unsplash.com/random/1920x1080/?nature,forest,blur'); background-size: cover; background-position: center;">
        <q-card class="glass-card q-pa-lg text-white" style="width: 450px; max-width: 95%;">
            <div class="glass-avatar-container q-mb-md">
                <q-icon name="person" size="70px" class="glass-avatar" />
            </div>
            <q-card-section class="text-center q-pt-none q-mt-xl">
                <div class="text-h5 text-weight-bold q-mb-xs" style="color: white;">Bienvenido</div>
                <div class="text-subtitle1 text-grey-4">Accede a tu cuenta de Inventario</div>
            </q-card-section>
            <q-card-section>
                <q-form @submit="handleLogin" class="q-gutter-md">

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
                            val => /.+@.+\..+/.test(val) || 'Ingresa un email válido'
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
                        label="Contraseña" 
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

                    <q-btn 
                        label="ACCEDER" 
                        type="submit" 
                        color="primary" 
                        text-color="black" 
                        size="lg"
                        class="full-width q-mt-xl" 
                        rounded 
                        :loading="loading" 
                        :disable="loading"
                    >
                        <template v-slot:loading>
                            <q-spinner-hourglass class="on-left" color="black" />
                            Verificando...
                        </template>
                    </q-btn>

                    <!-- ENLACE DE RECUPERACIÓN DE CONTRASEÑA -->
                    <div class="text-center q-mt-md">
                        <q-btn
                            flat
                            dense
                            no-caps
                            label="¿Olvidaste tu contraseña?"
                            color="grey-4"
                            size="md"
                            @click="router.push('/forgot-password')"
                            class="forgot-password-btn"
                        >
                            <q-icon name="lock_reset" size="xs" class="q-mr-xs" />
                        </q-btn>
                    </div>

                </q-form>
            </q-card-section>

            <q-card-section class="text-center q-pt-lg">
                <p class="text-grey-4 q-mb-xs text-body2">
                    ¿No tienes cuenta?
                </p>
                <router-link to="/register" class="text-primary text-weight-medium">Regístrate ahora</router-link>
            </q-card-section>

        </q-card>
    </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import axios from 'axios';

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);

const router = useRouter();
const $q = useQuasar();

// Configura la URL base de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';


const handleLogin = async () => {
    loading.value = true;

    try {
        // Realiza la petición al endpoint de login
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: email.value,
            password: password.value
        });

        // El backend devuelve: { token, nombre, rol }
        const { token, nombre, rol } = response.data;

        // Guarda el token en localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('userNombre', nombre);
        localStorage.setItem('userRol', rol);

        // Configura el token en los headers de axios para futuras peticiones
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Notificación de éxito
        $q.notify({
            type: 'positive',
            message: `¡Bienvenido ${nombre}! Acceso exitoso.`,
            position: 'top',
            icon: 'check_circle',
            timeout: 2500
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
                case 401:
                    errorMessage = 'Credenciales inválidas. Verifica tu correo y contraseña.';
                    break;
                case 422:
                    errorMessage = 'Datos inválidos. Verifica los campos del formulario.';
                    break;
                case 500:
                    errorMessage = 'Error interno del servidor. Intenta más tarde.';
                    break;
                default:
                    errorMessage = error.response.data?.message || errorMessage;
            }
        } else if (error.request) {
            // La petición se hizo pero no hubo respuesta
            errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
        }

        $q.notify({
            type: 'negative',
            message: errorMessage,
            position: 'top',
            icon: 'warning',
            timeout: 3000
        });

        console.error('Error en login:', error);
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

.forgot-password-btn {
    transition: all 0.3s ease;
}

.forgot-password-btn:hover {
    color: white !important;
    background: rgba(255, 255, 255, 0.1);
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