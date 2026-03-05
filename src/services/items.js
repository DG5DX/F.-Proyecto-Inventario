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

    async adjustStock(id, { tipo, cantidad, motivo }) {
        const { data } = await api.post(`/items/${id}/ajuste-stock`, { tipo, cantidad, motivo })
        return data
    },

    async getStockInfo(id) {
        const { data } = await api.get(`/items/${id}/stock-info`)
        return data
    },

    async update(id, itemData) {
        const {data} = await api.put(`/items/${id}`, itemData)
        return data
    },

    async delete(id) {
        await api.delete(`/items/${id}`)
    },

    async bulkCreate(items) {
        const { data } = await api.post('/items/bulk', { items })
        return data
    }
}

export const zonesService = {
    async getAll() {
        const {data} = await api.get('/zonas')
        return data
    },

    async create(zoneData) {
        const {data} = await api.post('/zonas', zoneData)
        return data
    },

    async update(id, zoneData) {
        const {data} = await api.put(`/zonas/${id}`, zoneData)
        return data
    },

    async delete(id) {
        await api.delete(`/zonas/${id}`)
    }
}

export const classroomsService = {
    async getAll(params = {}) {
        const {data} = await api.get('/aulas', { params })
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

    /**
     * Crear préstamo multi-item.
     * loanData = {
     *   items: [{ item, aula, cantidad_prestamo, observacion_item? }],
     *   fecha_sugerida_usuario: ISO string,
     *   observacion_solicitud?: string
     * }
     */
    async create(loanData) {
        const {data} = await api.post('/prestamos', loanData)
        return data
    },

    /**
     * Aprobar préstamo multi-item.
     * body = {
     *   fecha_estimada: ISO string,
     *   approvals: [{ loanItemId, cantidad_aprobada }],
     *   itemsToRemove: [loanItemId],
     *   observacion_aprobacion?: string
     * }
     */
    async approve(id, body) {
        const {data} = await api.post(`/prestamos/${id}/aprobar`, body)
        return data
    },

    async reject(id, observacion_rechazo) {
        const {data} = await api.post(`/prestamos/${id}/rechazar`, { observacion_rechazo })
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

    /**
     * Notificar devolución de un ítem específico del préstamo.
     * payload = { loanItemId, cantidadDevuelta, observacion? }
     */
    async notifyReturn(id, payload) {
        const { data: res } = await api.post(`/prestamos/${id}/notificar-devolucion`, payload)
        return res
    },

    /**
     * Admin confirma devolución parcial de un ítem.
     * payload = { loanItemId, cantidadConfirmada, observacion_recepcion? }
     */
    async confirmPartialReturn(id, payload) {
        const { data } = await api.post(`/prestamos/${id}/confirmar-parcial`, payload)
        return data
    },

    async delete(id) {
        await api.delete(`/prestamos/${id}`)
    }
}