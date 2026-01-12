import api from './api.js'

export const itemsService = {
    async getAll(params = {}) {
        const {data} = await api.get('/items', {params})
        return data
    },

    async getById(id) {
        const { data } = await api.get(`/items/${id}`)
        return data
    },
    
    async create(itemData) {
        const {data} = await api.post('/items', itemData)
        return data
    },

    async update(id, itemData) {
        const {data} = await api.put(`/items/${id}`, itemData)
        return data
    },

    async delete(id) {
        await api.delete(`/items/${id}`)
    }
}

export const categoriesService = {
    async getAll() {
        const {data} = await api.get('/categorias')
        return data
    },

    async create(categoryData) {
        const {data} = await api.post('/categorias', categoryData)
        return data
    },

    async update(id, categoryData) {
        const {data} = await api.put(`/categorias/${id}`, categoryData)
        return data
    },

    async delete(id) {
        await api.delete(`/categorias/${id}`)
    }
}

export const classroomsService = {
    async getAll() {
        const {data} = await api.get('/aulas')
        return data
    },

    async create(classroomData) {
        const {data} = await api.post('/aulas', classroomData)
        return data
    },

    async update(id, classroomData) {
        const {data} = await api.put(`/aulas/${id}`, classroomData)
        return data
    },

    async delete(id) {
        await api.delete(`/aulas/${id}`)
    }
}

export const loansService = {
    async getAll(params = {}) {
        const {data} = await api.get('/prestamos', {params})
        return data
    },

    async getById(id) {
        const {data} = await api.get(`/prestamos/${id}`)
        return data
    },

    async create(loanData) {
        const {data} = await api.post('/prestamos', loanData)
        return data
    },

    async approve(id, fecha_estimada) {
        const {data} = await api.post(`/prestamos/${id}/aprobar`, {fecha_estimada})
        return data
    },

    async reject(id) {
        const {data} = await api.post(`/prestamos/${id}/rechazar`)
        return data
    },

    async return(id) {
        const {data} = await api.post(`/prestamos/${id}/devolver`)
        return data
    },

    async delay(id, nueva_fecha_estimada) {
        const {data} = await api.post(`/prestamos/${id}/aplazar`, {nueva_fecha_estimada})
        return data
    },

    async delete(id) {
        await api.delete(`/prestamos/${id}`)
    }
}