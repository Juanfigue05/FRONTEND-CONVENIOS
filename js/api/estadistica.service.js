import { request } from './apiClient.js';

export const estadisticaService = {
    /**
     * Obtener todas las estadísticas
     * @returns {Promise<Array>}
     */
    getAllEstadisticas: () => {
        return request('/estadisticas/obtener-todas');
    },

    /**
     * Obtener una estadística por su ID
     * @param {number} id - El ID de la estadística
     * @returns {Promise<object>}
     */
    getEstadisticaById: (id) => {
        return request(`/estadisticas/obtener-por-id/${id}`);
    },

    /**
     * Obtener estadísticas por categoría
     * @param {string} categoria - La categoría a buscar
     * @returns {Promise<Array>}
     */
    getEstadisticasByCategoria: (categoria) => {
        return request(`/estadisticas/obtener-por-categoria?categoria=${encodeURIComponent(categoria)}`);
    },

    /**
     * Obtener estadísticas por nombre
     * @param {string} nombre - El nombre a buscar
     * @returns {Promise<Array>}
     */
    getEstadisticasByNombre: (nombre) => {
        return request(`/estadisticas/obtener-por-nombre?nombre=${encodeURIComponent(nombre)}`);
    },

    /**
     * Obtener estadísticas por categoría exacta
     * @param {string} categoria - La categoría exacta a buscar
     * @returns {Promise<Array>}
     */
    getEstadisticasByCategoriaExacta: (categoria) => {
        return request(`/estadisticas/obtener-por-categoria-exacta?categoria=${encodeURIComponent(categoria)}`);
    },

    /**
     * Crear una nueva estadística
     * @param {object} estadisticaData - Los datos de la estadística
     * @returns {Promise<object>}
     */
    createEstadistica: (estadisticaData) => {
        return request('/estadisticas/registrar', {
            method: 'POST',
            body: JSON.stringify(estadisticaData)
        });
    },

    /**
     * Actualizar una estadística
     * @param {number} id - El ID de la estadística a actualizar
     * @param {object} estadisticaData - Los nuevos datos
     * @returns {Promise<object>}
     */
    updateEstadistica: (id, estadisticaData) => {
        return request(`/estadisticas/editar/${id}`, {
            method: 'PUT',
            body: JSON.stringify(estadisticaData)
        });
    },

    /**
     * Eliminar una estadística
     * @param {number} id - El ID de la estadística a eliminar
     * @returns {Promise<object>}
     */
    deleteEstadistica: (id) => {
        return request(`/estadisticas/eliminar-por-id/${id}`, {
            method: 'DELETE'
        });
    }
};
