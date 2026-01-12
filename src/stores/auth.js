import { defineStore } from 'pinia'
import api from '../services/api.js'
import { jwtDecode } from 'jwt-decode'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || null,
        user: null
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        isAdmin: (state) => state.user?.rol === 'Admin',
        userName: (state) => state.user?.nombre || ''
    },

    actions: {
        async login(email, password){
            try {
                const { data } = await api.post('/auth/login', {email, password})
                this.token = data.token
                localStorage.setItem('token', data.token)
                
                const decoded = jwtDecode(data.token)
                this.user = {
                    nombre: data.nombre,
                    rol: data.rol,
                    id: decoded.sub
                }
                return { success: true }
            } catch (error) {
                return {
                    success: false,
                    message: error.response?.data?.message || 'Error al iniciar sesión'
                }
            }
        },

        async register(nombre, email, password) {
            try {
                const { data } = await api.post('/auth/register', {nombre, email, password})
                this.token = data.token
                localStorage.setItem('token', data.token)

                const decoded = jwtDecode(data.token)
                this.user = {
                    nombre: data.nombre,
                    rol: data.rol,
                    id: decoded.sub
                }
                return { success: true }
            } catch (error) {
                return {
                    success: false,
                    message: error.response?.data?.message || 'Error al registrarse'
                }
            }
        },
        async fetchUser() {
            if (!this.token) return
            try {
                const {data} = await api.get('/auth/me')
                this.user = data
            } catch (error) {
                this.logout()
            }
        },
        logout() {
            this.token = null
            this.user = null
            localStorage.removeItem('token')
        }
    }
})